import { defineErrors } from '../../common/errors/define-errors';

export const MAIL_ERRORS = defineErrors({
  MAIL_PROVIDER_ERROR: 'Falha ao enviar email via provedor',
  MAIL_RATE_LIMITED:
    'Limite de envio de emails atingido. Tente novamente mais tarde.',
  MAIL_INVALID_RECIPIENT: 'Endereço de email do destinatário inválido',
});
