import { Injectable, Logger } from '@nestjs/common';
import { MailService, SendCodeParams, SendResult } from './mail.service';

/**
 * Driver `mock` do {@link MailService}: loga no console sem enviar
 * emails reais. Ativado quando `MAIL_DRIVER=mock` (padrão em dev/test).
 *
 * Cada chamada:
 * 1. Loga os parâmetros via NestJS Logger (visível no console do dev).
 * 2. Armazena a chamada em `sentEmails` (útil para inspeção em testes).
 * 3. Retorna um `messageId` fake no formato `mock_<timestamp>`.
 */
@Injectable()
export class MockMailService extends MailService {
  private readonly logger = new Logger(MockMailService.name);

  readonly sentEmails: Array<{
    method: string;
    params: SendCodeParams;
    messageId: string;
  }> = [];

  sendVerificationCode(params: SendCodeParams): Promise<SendResult> {
    return Promise.resolve(this.record('sendVerificationCode', params));
  }

  sendPasswordResetCode(params: SendCodeParams): Promise<SendResult> {
    return Promise.resolve(this.record('sendPasswordResetCode', params));
  }

  private record(method: string, params: SendCodeParams): SendResult {
    const messageId = `mock_${Date.now()}`;

    this.logger.log(
      `[MOCK] ${method} -> ${params.email} (code: ${params.code}, expires: ${params.expiresAt.toISOString()})`,
    );

    this.sentEmails.push({ method, params, messageId });
    return { messageId };
  }
}
