import { defineErrors } from './define-errors';

/**
 * Codes globais usados por guards, interceptors e infra do framework.
 * Codes especificos de modulo ficam em `<modulo>/<modulo>.errors.ts`.
 *
 * IMPORTANTE: `role_denied` e `validation_failed` sao codes com mensagem
 * dinamica (recebem argumentos em runtime). Eles sao tratados como casos
 * especiais dentro de `apiError()` e nao entram aqui.
 */
export const SHARED_ERRORS = defineErrors({
  UNAUTHENTICATED: 'Token ausente, inválido ou expirado',
  CITY_SCOPE_DENIED: 'ADMIN só pode atuar em sua própria cidade',
  CITY_REQUIRED: 'Super Admin deve informar a cidade (cityId) no payload',
  SUPER_ADMIN_REQUIRED: 'Acesso negado: requer privilégios de Super Admin',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas. Aguarde e tente novamente.',
  MALFORMED_JSON: 'Corpo da requisição contém JSON inválido',
  NOT_OWNER_OR_ADMIN:
    'Acesso negado: você não é o proprietário deste recurso nem administrador desta cidade',
  MULTIPLE_TARGETS: 'Mais de um campo de target enviado',
  NO_TARGET: 'Nenhum target enviado',
  TARGET_NOT_FOUND: 'ID alvo inexistente',
});
