import { defineErrors } from '../../common/errors/define-errors';

export const NEWS_ERRORS = defineErrors({
  NEWS_NOT_FOUND: 'Notícia não encontrada',
  INVALID_TYPE: 'Tipo de notícia inválido',
  INVALID_LINK_TYPE: 'Tipo de link inválido',
});
