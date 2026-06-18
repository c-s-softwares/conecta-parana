import { defineErrors } from '../../common/errors/define-errors';

export const SEARCH_ERRORS = defineErrors({
  QUERY_TOO_SHORT: 'A busca deve ter pelo menos 3 caracteres',
  INVALID_TYPES: 'Os tipos fornecidos para busca são inválidos',
});
