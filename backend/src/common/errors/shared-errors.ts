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
  TOO_MANY_ATTEMPTS: 'Muitas tentativas. Aguarde e tente novamente.',
});
