/**
 * Fonte única de verdade para os corpos de erro da API.
 *
 * Contrato: o backend devolve `{ code, message }`, onde `code` é o
 * identificador de máquina e `message` é o *motivo* em PT-BR. O frontend
 * (/admin) tem o próprio mapa `code -> mensagem ao usuário`.
 *
 * O backend nunca decide o texto final do usuário, apenas o motivo.
 */
export const API_ERROR_CODE = {
  UNAUTHENTICATED: 'unauthenticated',
  ROLE_DENIED: 'role_denied',
  CITY_SCOPE_DENIED: 'city_scope_denied',
  CITY_REQUIRED: 'city_required',
  VALIDATION_FAILED: 'validation_failed',
  TOO_MANY_ATTEMPTS: 'too_many_attempts',
  CITY_NOT_FOUND: 'city_not_found',
  CITY_DUPLICATE: 'city_duplicate',
  CITY_HAS_CONTENT: 'city_has_content',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

// validation_failed devolve uma lista de mensagens de validação, por isso string[].
export type ApiErrorBody = { code: ApiErrorCode; message: string | string[] };

// Códigos cujo motivo é fixo (não dependem de dado dinâmico).
export type StaticCode = Exclude<
  ApiErrorCode,
  typeof API_ERROR_CODE.ROLE_DENIED | typeof API_ERROR_CODE.VALIDATION_FAILED
>;

// Alinhamento manual proposital - melhora legibilidade da tabela code
// IDEIA: usar ESLint Stylistic e retirar o prettier no futuro
// prettier-ignore
const STATIC_MESSAGE: Record<StaticCode, string> = {
  [API_ERROR_CODE.UNAUTHENTICATED]:    'Token ausente, inválido ou expirado',
  [API_ERROR_CODE.CITY_SCOPE_DENIED]:  'ADMIN só pode atuar em sua própria cidade',
  [API_ERROR_CODE.CITY_REQUIRED]:      'Super Admin deve informar a cidade (cityId) no payload',
  [API_ERROR_CODE.TOO_MANY_ATTEMPTS]:  'Muitas tentativas. Aguarde e tente novamente.',
  [API_ERROR_CODE.CITY_NOT_FOUND]:     'Cidade não encontrada',
  [API_ERROR_CODE.CITY_DUPLICATE]:     'Cidade já cadastrada',
  [API_ERROR_CODE.CITY_HAS_CONTENT]:   'Cidade possui conteúdo associado',
};

// Função para manter a(s) role(s) exigida(s) dentro do motivo.
const roleDeniedMessage = (roles: string[]): string => {
  return roles.length > 0
    ? `Acesso negado: requer role ${roles.join(' ou ')}`
    : 'Acesso negado: role não identificada';
};

export function apiError(
  code: typeof API_ERROR_CODE.ROLE_DENIED,
  roles: string[],
): ApiErrorBody;

export function apiError(
  code: typeof API_ERROR_CODE.VALIDATION_FAILED,
  messages: string[],
): ApiErrorBody;

export function apiError(code: StaticCode): ApiErrorBody;

export function apiError(
  code: ApiErrorCode,
  detail: string[] = [],
): ApiErrorBody {
  switch (code) {
    case API_ERROR_CODE.ROLE_DENIED:
      return { code, message: roleDeniedMessage(detail) };
    case API_ERROR_CODE.VALIDATION_FAILED:
      return { code, message: detail };
    default:
      return { code, message: STATIC_MESSAGE[code] };
  }
}
