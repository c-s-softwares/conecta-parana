import { defineErrors } from '../../common/errors/define-errors';

export const CITIES_ERRORS = defineErrors({
  CITY_NOT_FOUND: 'Cidade não encontrada',
  CITY_DUPLICATE: 'Cidade já cadastrada',
  CITY_HAS_CONTENT: 'Cidade possui conteúdo associado',
});
