/**
 * Registry global de codes de erro modulares.
 *
 * Cada feature declara seus codes no próprio módulo via `defineErrors`. O
 * registry é populado em tempo de import - quando o módulo NestJS importa
 * seu service, o service importa o catálogo, o catálogo executa
 * `defineErrors(...)` e registra os codes aqui.
 *
 * `apiError(code)` (api-error.ts) consulta este registry para resolver a
 * mensagem. Codes desconhecidos lançam erro claro - fail-fast.
 */

const REGISTRY = new Map<string, string>();

type CatalogInput = Record<string, string>;

/**
 * Tipo de retorno do `defineErrors`: cada chave da catalog vira uma string
 * literal `lowercase` (snake_case), preservando o autocomplete local.
 *
 * Ex: defineErrors({ INVALID_FILE_TYPE: '...' }) -> { INVALID_FILE_TYPE: 'invalid_file_type' }
 */
export type ErrorCodes<T extends CatalogInput> = {
  readonly [K in keyof T]: Lowercase<K & string>;
};

/**
 * Declara um catálogo de erros de módulo. Registra cada (code -> message)
 * no registry global e devolve um objeto tipado para uso no service.
 *
 * @example
 *   export const UPLOAD_ERRORS = defineErrors({
 *     INVALID_FILE_TYPE: 'Tipo de arquivo não suportado',
 *   });
 *   // ... uploads.service.ts
 *   throw new BadRequestException(apiError(UPLOAD_ERRORS.INVALID_FILE_TYPE));
 */
export function defineErrors<T extends CatalogInput>(
  catalog: T,
): ErrorCodes<T> {
  const result = {} as { [K in keyof T]: Lowercase<K & string> };
  for (const key of Object.keys(catalog) as Array<keyof T & string>) {
    const code = key.toLowerCase() as Lowercase<typeof key>;
    if (REGISTRY.has(code)) {
      throw new Error(
        `defineErrors: code duplicado "${code}". Cada code deve ser único no registry global.`,
      );
    }
    REGISTRY.set(code, catalog[key]);
    result[key] = code;
  }
  return result as ErrorCodes<T>;
}

export function getMessageForCode(code: string): string | undefined {
  return REGISTRY.get(code);
}

/**
 * Apenas para testes - permite resetar o registry entre suites isoladas.
 * Não usar em código de produção.
 */
export function __resetRegistryForTests(): void {
  REGISTRY.clear();
}
