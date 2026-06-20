import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as Sentry from '@sentry/node';
import { apiError } from '../../common/errors/api-error';
import { MAIL_ERRORS } from './mail.errors';
import {
  MailService,
  SendAdminWelcomeParams,
  SendCodeParams,
  SendResult,
} from './mail.service';

/** Forma normalizada de um erro vindo do provedor de email. */
interface ProviderError extends Error {
  statusCode: number | null;
}

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  attempts: 3,
  baseDelayMs: 200,
};

/** Type guard: verifica se o valor é um ProviderError com statusCode numérico. */
function isProviderError(err: unknown): err is ProviderError {
  return (
    err instanceof Error &&
    'statusCode' in err &&
    typeof (err as ProviderError).statusCode === 'number'
  );
}

/**
 * Driver `resend` do {@link MailService}: integra Resend API.
 * Ativado quando `MAIL_DRIVER=resend` (padrão em staging/produção).
 *
 * Responsabilidades:
 * - Enviar emails transacionais via Resend SDK.
 * - Retry exponencial em falhas transitórias (5xx e 429).
 * - Logar erros no GlitchTip via Sentry.captureException().
 * - Mapear erros do provedor para codes internos (MAIL_ERRORS).
 *
 * **Lazy init:** o cliente Resend é construído sob demanda na primeira
 * chamada de envio, NÃO no boot do app. Permite que testes e2e que
 * mockam o MailService não precisem de API key real.
 */
@Injectable()
export class ResendMailService extends MailService {
  private readonly logger = new Logger(ResendMailService.name);
  private client: Resend | null = null;
  private from: string | null = null;

  constructor(private readonly config: ConfigService) {
    super();
  }

  async sendVerificationCode(params: SendCodeParams): Promise<SendResult> {
    const html = this.renderTemplate('email-verification-code', {
      code: params.code,
      expiresAt: this.formatDate(params.expiresAt),
    });

    return this.send({
      to: params.email,
      subject: `${params.code} - Código de verificação`,
      html,
    });
  }

  async sendPasswordResetCode(params: SendCodeParams): Promise<SendResult> {
    const html = this.renderTemplate('email-password-reset-code', {
      code: params.code,
      expiresAt: this.formatDate(params.expiresAt),
    });

    return this.send({
      to: params.email,
      subject: `${params.code} - Recuperação de senha`,
      html,
    });
  }

  async sendAdminWelcome(params: SendAdminWelcomeParams): Promise<SendResult> {
    const html = this.renderTemplate('admin-welcome', {
      name: params.name,
      email: params.email,
      password: params.password,
      cityName: params.cityName,
    });

    return this.send({
      to: params.email,
      subject: `Bem-vindo ao Conecta Paraná — ${params.cityName}`,
      html,
    });
  }

  private getClient(): { client: Resend; from: string } {
    if (!this.client || !this.from) {
      const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
      this.from = this.config.getOrThrow<string>('MAIL_FROM');
      this.client = new Resend(apiKey);
    }
    return { client: this.client, from: this.from };
  }

  private async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<SendResult> {
    const { client, from } = this.getClient();

    const result = await this.withRetry(async () => {
      const { data, error } = await client.emails.send({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        const wrapped = new Error(error.message) as ProviderError;
        wrapped.statusCode = error.statusCode;
        throw wrapped;
      }

      return data;
    });

    return { messageId: result.id };
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
          `Mail: erro transitório (tentativa ${i + 1}/${attempts}), retry em ${delay}ms`,
        );
        await this.sleep(delay);
      }
    }

    // Erro 422 (destinatário inválido) é erro do cliente, não do provedor.
    // Não loga no GlitchTip - não é bug nem falha de infra.
    if (isProviderError(lastErr) && lastErr.statusCode === 422) {
      this.logger.warn(`Mail: destinatário inválido - ${lastErr.message}`);
      throw new InternalServerErrorException(
        apiError(MAIL_ERRORS.MAIL_INVALID_RECIPIENT),
      );
    }

    // Erros transitórios (5xx, 429) que esgotaram retry -> GlitchTip.
    Sentry.captureException(lastErr);

    if (isProviderError(lastErr) && lastErr.statusCode === 429) {
      this.logger.error('Mail: rate limited - retry esgotado');
      throw new InternalServerErrorException(
        apiError(MAIL_ERRORS.MAIL_RATE_LIMITED),
      );
    }

    this.logger.error('Mail: erro do provedor - retry esgotado');
    throw new InternalServerErrorException(
      apiError(MAIL_ERRORS.MAIL_PROVIDER_ERROR),
    );
  }

  private isTransient(err: unknown): boolean {
    if (!isProviderError(err)) return false;
    if (err.statusCode === null) return false;
    return err.statusCode >= 500 || err.statusCode === 429;
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
