import { defineErrors } from '../../common/errors/define-errors';

export const CATEGORY_ERRORS = defineErrors({
  CATEGORY_NOT_FOUND: 'Categoria nao encontrada',
  CATEGORY_DUPLICATE: 'Categoria ja cadastrada',
  CATEGORY_HAS_LOCALS: 'Categoria possui locais associados',
  INVALID_ICON: 'Icone invalido',
});
