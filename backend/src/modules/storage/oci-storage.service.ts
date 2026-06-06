import { readFileSync } from 'fs';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as common from 'oci-common';
import { ObjectStorageClient, models } from 'oci-objectstorage';
import { apiError } from '../../common/errors/api-error';
import { STORAGE_ERRORS } from './storage.errors';
import { StorageService } from './storage.service';

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  attempts: 3,
  baseDelayMs: 200,
};

/**
 * Driver `oci` do {@link StorageService}: integra Oracle Object Storage.
 * Ativado quando `STORAGE_DRIVER=oci` (padrão em staging/produção).
 *
 * Responsabilidades:
 * - Autenticar requisições via API Key (SimpleAuthenticationDetailsProvider).
 * - Upload e delete de objetos no bucket configurado.
 * - Gerar URLs públicas (bucket Public para leitura) e URLs assinadas
 *   pré-autenticadas (PAR) para casos futuros de acesso temporário.
 * - Retry exponencial em falhas transitórias (rede e 5xx).
 *
 * O serviço propaga ServiceUnavailableException(STORAGE_UNAVAILABLE)
 * quando o retry se esgota, deixando que o SentryExceptionFilter capture
 * o erro para o GlitchTip e o cliente receba o code padronizado.
 *
 * **Lazy init:** o cliente OCI (incluindo a leitura do .pem) é construído
 * sob demanda na primeira chamada de upload/delete/getSignedUrl, NÃO no
 * boot do app. Isso permite que:
 * - Testes e2e que mockam o StorageService não precisem de .pem em disco.
 * - O CI execute outras suites e2e sem provisionar credenciais OCI reais.
 * - Em produção, a falha de leitura do .pem aparece na primeira tentativa
 *   de upload (com stack clara) em vez de quebrar o boot do app inteiro.
 *
 * As variáveis de ambiente OCI_* continuam sendo validadas no boot pelo
 * Joi (env.validation.ts) - garantindo fail-fast de configuração ausente.
 */
@Injectable()
export class OciStorageService extends StorageService {
  private readonly logger = new Logger(OciStorageService.name);
  private client: ObjectStorageClient | null = null;
  private namespace: string | null = null;
  private bucket: string | null = null;
  private region: string | null = null;

  constructor(private readonly config: ConfigService) {
    super();
  }

  /**
   * Inicializa o cliente OCI e os valores de namespace/bucket/region na
   * primeira chamada. Subsequentes reusam o cliente cacheado.
   */
  private getClient(): {
    client: ObjectStorageClient;
    namespace: string;
    bucket: string;
    region: string;
  } {
    if (!this.client || !this.namespace || !this.bucket || !this.region) {
      this.namespace = this.config.getOrThrow<string>(
        'OCI_OBJECT_STORAGE_NAMESPACE',
      );
      this.bucket = this.config.getOrThrow<string>('OCI_BUCKET_NAME');
      this.region = this.config.getOrThrow<string>('OCI_REGION');

      const provider = new common.SimpleAuthenticationDetailsProvider(
        this.config.getOrThrow<string>('OCI_TENANCY_OCID'),
        this.config.getOrThrow<string>('OCI_USER_OCID'),
        this.config.getOrThrow<string>('OCI_FINGERPRINT'),
        readFileSync(
          this.config.getOrThrow<string>('OCI_PRIVATE_KEY_PATH'),
          'utf8',
        ),
        null,
        common.Region.fromRegionId(this.region),
      );

      this.client = new ObjectStorageClient({
        authenticationDetailsProvider: provider,
      });
    }

    return {
      client: this.client,
      namespace: this.namespace,
      bucket: this.bucket,
      region: this.region,
    };
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const { client, namespace, bucket, region } = this.getClient();

    await this.withRetry(() =>
      client.putObject({
        namespaceName: namespace,
        bucketName: bucket,
        objectName: key,
        putObjectBody: buffer,
        contentLength: buffer.length,
        contentType,
      }),
    );

    return this.buildPublicUrl(region, namespace, bucket, key);
  }

  /**
   * Remove um objeto. Ambos os casos são capturados como sucesso.
   */
  async delete(key: string): Promise<void> {
    const { client, namespace, bucket } = this.getClient();

    try {
      await this.withRetry(() =>
        client.deleteObject({
          namespaceName: namespace,
          bucketName: bucket,
          objectName: key,
        }),
      );
    } catch (err) {
      if (this.isNotFound(err)) {
        this.logger.debug(`delete: objeto ${key} já inexistente, ignorando.`);
        return;
      }
      throw err;
    }
  }

  /**
   * Gera URL pré-assinada (Pre-Authenticated Request) com TTL definido.
   * Reservado para futuros casos de acesso temporário a objetos privados.
   */
  async getSignedUrl(key: string, ttlSeconds: number): Promise<string> {
    const { client, namespace, bucket, region } = this.getClient();

    const response = await this.withRetry(() =>
      client.createPreauthenticatedRequest({
        namespaceName: namespace,
        bucketName: bucket,
        createPreauthenticatedRequestDetails: {
          name: `par-${Date.now()}-${key}`,
          objectName: key,
          accessType:
            models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
          timeExpires: new Date(Date.now() + ttlSeconds * 1000),
        },
      }),
    );

    const accessUri = response.preauthenticatedRequest.accessUri;
    return `https://objectstorage.${region}.oraclecloud.com${accessUri}`;
  }

  private buildPublicUrl(
    region: string,
    namespace: string,
    bucket: string,
    key: string,
  ): string {
    const encoded = encodeURI(key);
    return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucket}/o/${encoded}`;
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    opts: RetryOptions = {},
  ): Promise<T> {
    const { attempts, baseDelayMs } = { ...DEFAULT_RETRY, ...opts };
    let lastErr: unknown;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (!this.isTransient(err) || i === attempts - 1) {
          break;
        }
        const delay = baseDelayMs * 2 ** i;
        this.logger.warn(
          `Storage transient error (attempt ${i + 1}/${attempts}), retrying in ${delay}ms`,
        );
        await this.sleep(delay);
      }
    }

    // Se o erro não for transient, propaga (4xx do SDK já vem com semântica clara).
    // Se for transient e esgotou, é mapeado para STORAGE_UNAVAILABLE.
    if (this.isTransient(lastErr)) {
      throw new ServiceUnavailableException(
        apiError(STORAGE_ERRORS.STORAGE_UNAVAILABLE),
      );
    }
    throw lastErr;
  }

  private isTransient(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const candidate = err as { statusCode?: number; code?: string };
    if (candidate.statusCode && candidate.statusCode >= 500) return true;
    const transientCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'EAI_AGAIN',
      'ECONNREFUSED',
      'ENETUNREACH',
    ];
    return (
      typeof candidate.code === 'string' &&
      transientCodes.includes(candidate.code)
    );
  }

  private isNotFound(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const candidate = err as { statusCode?: number };
    return candidate.statusCode === 404;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
