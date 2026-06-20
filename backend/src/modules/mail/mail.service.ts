import { readFileSync } from 'fs';
import { join } from 'path';

const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');

export interface SendCodeParams {
  email: string;
  code: string;
  expiresAt: Date;
}

export interface SendAdminWelcomeParams {
  email: string;
  name: string;
  password: string;
  cityName: string;
}

export interface SendResult {
  messageId: string;
}

/**
 * Contrato abstrato para o serviço de email transacional.
 *
 * Existem dois drivers concretos:
 * - {@link ResendMailService} - Resend API (staging/prod).
 * - {@link MockMailService} - loga no console sem enviar (dev/test).
 *
 * O driver ativo é escolhido pela env `MAIL_DRIVER` (`mock` | `resend`) e
 * resolvido via factory provider no {@link MailModule}. Quem injeta
 * `MailService` recebe a implementação correta para o ambiente sem
 * conhecer qual driver está em uso.
 */
export abstract class MailService {
  private readonly templateCache = new Map<string, string>();

  abstract sendVerificationCode(params: SendCodeParams): Promise<SendResult>;

  abstract sendPasswordResetCode(params: SendCodeParams): Promise<SendResult>;

  abstract sendAdminWelcome(
    params: SendAdminWelcomeParams,
  ): Promise<SendResult>;

  /**
   * Carrega um template HTML de `backend/src/templates/<name>.html`.
   * O resultado é cacheado em memória após a primeira leitura.
   */
  protected loadTemplate(name: string): string {
    const cached = this.templateCache.get(name);
    if (cached) return cached;

    const filePath = join(TEMPLATES_DIR, `${name}.html`);
    const content = readFileSync(filePath, 'utf8');
    this.templateCache.set(name, content);
    return content;
  }

  /**
   * Substitui placeholders `{{key}}` no template pelos valores fornecidos.
   */
  protected renderTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    let html = this.loadTemplate(templateName);
    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }
    return html;
  }
}
