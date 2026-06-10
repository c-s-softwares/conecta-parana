import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendMailService } from './resend-mail.service';
import { MockMailService } from './mock-mail.service';
import { MailService } from './mail.service';

/**
 * Disponibiliza o {@link MailService} apropriado para o ambiente:
 *
 * - `MAIL_DRIVER=mock` (padrão em dev/test) -> {@link MockMailService}:
 *   loga no console sem enviar emails reais.
 * - `MAIL_DRIVER=resend` (padrão em staging/prod) -> {@link ResendMailService}:
 *   integração real com Resend API.
 *
 * Mesmo padrão do {@link StorageModule}: ambos os concretos são
 * instanciados via DI, e a factory decide qual atende o token público
 * `MailService`. Quem injeta `MailService` não conhece o driver.
 */
@Module({
  providers: [
    ResendMailService,
    MockMailService,
    {
      provide: MailService,
      useFactory: (
        config: ConfigService,
        resend: ResendMailService,
        mock: MockMailService,
      ): MailService =>
        config.get<string>('MAIL_DRIVER') === 'resend' ? resend : mock,
      inject: [ConfigService, ResendMailService, MockMailService],
    },
  ],
  exports: [MailService],
})
export class MailModule {}
