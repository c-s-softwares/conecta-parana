import { defineErrors } from '../../common/errors/define-errors';

export const TICKET_ERRORS = defineErrors({
  TICKET_NOT_FOUND: 'Chamado não encontrado',
  INVALID_TYPE: 'Tipo de chamado inválido',
  PHOTO_NOT_FOUND: 'Foto não encontrada ou não pertence ao usuário',
  INVALID_STATUS_TRANSITION: 'Transição de status inválida',
  USER_WITHOUT_CITY: 'Cidadão sem cidade associada não pode criar chamados',
});
