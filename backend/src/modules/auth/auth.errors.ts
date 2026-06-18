import { defineErrors } from '../../common/errors/define-errors';
import { STRONG_PASSWORD_MESSAGE } from '../../common/utils/password.util';

export const AUTH_ERRORS = defineErrors({
  INVALID_PASSWORD: 'Senha incorreta',

  /**
   * Credenciais inválidas - mensagem genérica para login (não diferencia
   * "email não existe" de "senha errada") para evitar enumeração de usuários.
   */
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  INVALID_REFRESH_TOKEN: 'Refresh token inválido ou expirado',

  /**
   * Falha genérica de registro - usado quando o email já está cadastrado, para
   * evitar enumeração de emails via /auth/register.
   *
   * TODO: quando o serviço de email transacional for adicionado, migrar para o
   * fluxo "sempre retornar 201 + enviar email de aviso ao dono do endereço".
   */
  REGISTRATION_FAILED:
    'Não foi possível processar o registro. Verifique seus dados e tente novamente.',

  INVALID_OR_EXPIRED_CODE: 'Código inválido, expirado ou já utilizado',

  WEAK_PASSWORD: STRONG_PASSWORD_MESSAGE,

  EMAIL_NOT_VERIFIED: 'Email ainda não verificado. Confirme o código enviado.',
});
