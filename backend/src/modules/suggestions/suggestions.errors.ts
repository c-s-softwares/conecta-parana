import { defineErrors } from '../../common/errors/define-errors';

export const SUGGESTIONS_ERRORS = defineErrors({
  SUGGESTION_NOT_FOUND: 'Sugestão não encontrada',
  MESSAGE_TOO_LONG: 'Mensagem excede o limite de 1000 caracteres',
  SUBJECT_TOO_LONG: 'Assunto excede o limite de 200 caracteres',
  INVALID_STATUS_TRANSITION: 'Transição de status inválida',
  USER_WITHOUT_CITY: 'Cidadão sem cidade associada não pode enviar sugestões',
  // NOT_OWNER_OR_ADMIN foi movido para SHARED_ERRORS (compartilhado entre módulos).
});
