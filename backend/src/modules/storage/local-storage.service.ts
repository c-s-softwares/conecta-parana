import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { dirname, resolve, sep } from 'path';
import { StorageService } from './storage.service';

/**
 * Diretório raiz onde os arquivos são persistidos pelo driver local.
 * Relativo ao cwd do processo (geralmente `backend/`).
 * Está no `.gitignore`.
 */
export const LOCAL_STORAGE_DIR = '.local-uploads';

/**
 * Driver `local` do {@link StorageService}: persiste arquivos no disco local
 * em `backend/.local-uploads/<key>` e devolve URLs apontando para o próprio
 * backend (`/dev-uploads/<key>`), servidas pelo {@link LocalUploadsController}.
 *
 * Ativado quando `STORAGE_DRIVER=local` (padrão em desenvolvimento). Permite
 * que devs trabalhem na plataforma sem precisar de conta Oracle Cloud, sem
 * chave `.pem` e sem risco de afetar buckets compartilhados de staging/prod.
 *
 * Limitações intencionais:
 * - Os arquivos só estão acessíveis enquanto o backend estiver rodando.
 * - `getSignedUrl` apenas devolve a URL pública (não há autenticação no
 *   controller local). Reservado para paridade de interface.
 * - Não testa comportamento real do OCI (retry de rede, PAR, etc) - quem
 *   precisa disso usa `STORAGE_DRIVER=oci` com bucket próprio.
 */
@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly storageDir: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.storageDir = resolve(process.cwd(), LOCAL_STORAGE_DIR);
    const port = this.config.get<number>('PORT') ?? 3000;
    this.baseUrl = `http://localhost:${port}/dev-uploads`;
  }

  async upload(
    key: string,
    buffer: Buffer,
    _contentType: string,
  ): Promise<string> {
    // _contentType ignorado: o tipo MIME já está embutido no arquivo no
    // disco e o Express infere o Content-Type via extensão no res.sendFile.
    void _contentType;
    const filePath = this.resolveSafe(key);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    this.logger.debug(`upload local: ${key} (${buffer.length} bytes)`);
    return this.buildUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveSafe(key);
    try {
      await fs.unlink(filePath);
      this.logger.debug(`delete local: ${key}`);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Idempotente: arquivo já não existe.
        return;
      }
      throw err;
    }
  }

  async getSignedUrl(key: string, _ttlSeconds: number): Promise<string> {
    // Não há noção de "assinado" localmente - todos os arquivos são
    // públicos via /dev-uploads. Mantemos a assinatura para paridade
    // de interface com o driver OCI.
    void _ttlSeconds;
    return Promise.resolve(this.buildUrl(key));
  }

  private buildUrl(key: string): string {
    return `${this.baseUrl}/${encodeURI(key)}`;
  }

  /**
   * Resolve o caminho absoluto do arquivo a partir da `key` e garante que
   * ele NÃO escape do diretório de storage (mitigação de path traversal:
   * se a key vier com `../`, o resolve fica fora do `storageDir`).
   */
  private resolveSafe(key: string): string {
    const filePath = resolve(this.storageDir, key);
    if (
      filePath !== this.storageDir &&
      !filePath.startsWith(this.storageDir + sep)
    ) {
      throw new Error(`Path traversal bloqueado: ${key}`);
    }
    return filePath;
  }
}

/**
 * Retorna o caminho absoluto do diretório de storage local. Usado pelo
 * controller que serve os arquivos.
 */
export function getLocalStorageDir(): string {
  return resolve(process.cwd(), LOCAL_STORAGE_DIR);
}
