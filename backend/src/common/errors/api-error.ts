import { getMessageForCode } from './define-errors';

export type ApiErrorBody = { code: string; message: string | string[] };

export const ROLE_DENIED = 'role_denied';
export const VALIDATION_FAILED = 'validation_failed';

/**
 * Constrói o corpo padrão de erro da API.
 *
 * Contrato HTTP: `{ code, message }`, onde `code` é o identificador de
 * máquina (snake_case) e `message` é o motivo em PT-BR. O frontend mantém
 * o próprio mapa `code -> mensagem ao usuário final`.
 *
 * Como adicionar um novo erro de módulo:
 *   1. Declare o catálogo em `modules/<modulo>/<modulo>.errors.ts` usando
 *      `defineErrors({ MEU_CODE: 'mensagem em PT-BR' })`.
 *   2. Importe e use:
 *        throw new BadRequestException(apiError(MEU_MODULO_ERRORS.MEU_CODE));
 *   Não é necessário alterar este arquivo nem `define-errors.ts`.
 *
 * Codes globais (auth/throttling) vivem em `shared-errors.ts`.
 *
 * Codes com mensagem dinâmica recebem argumentos extras:
 *   apiError(ROLE_DENIED, ['ADMIN'])           -> "Acesso negado: requer role ADMIN"
 *   apiError(VALIDATION_FAILED, [msg1, msg2])  -> message é o array de validações
 *
 * Codes não registrados lançam erro em runtime - registre-os via `defineErrors`.
 */
export function apiError(
  code: typeof ROLE_DENIED,
  roles: string[],
): ApiErrorBody;
export function apiError(
  code: typeof VALIDATION_FAILED,
  messages: string[],
): ApiErrorBody;
export function apiError(code: string): ApiErrorBody;

export function apiError(code: string, detail: string[] = []): ApiErrorBody {
  if (code === ROLE_DENIED) {
    return {
      code,
      message:
        detail.length > 0
          ? `Acesso negado: requer role ${detail.join(' ou ')}`
          : 'Acesso negado: role não identificada',
    };
  }

  if (code === VALIDATION_FAILED) {
    return { code, message: detail };
  }

  const message = getMessageForCode(code);

  if (message === undefined) {
    throw new Error(
      `apiError: code "${code}" não registrado. Defina-o em um arquivo *.errors.ts via defineErrors().`,
    );
  }

  return { code, message };
}
