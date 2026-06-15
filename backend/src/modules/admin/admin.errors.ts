import { defineErrors } from '../../common/errors/define-errors';

export const ADMIN_ERRORS = defineErrors({
  /**
   * Email já cadastrado em users.
   *
   * Diferente de auth/register (que mascara para `registration_failed` para
   * evitar enumeração), aqui o endpoint exige Super Admin, portanto expor o
   * code `email_exists` é seguro e útil para o operador.
   */
  EMAIL_EXISTS: 'Este email já está em uso',
});
