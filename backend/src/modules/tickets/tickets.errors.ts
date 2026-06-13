import { defineErrors } from '../../common/errors/define-errors';

export const TICKET_ERRORS = defineErrors({
  TICKET_NOT_FOUND: 'Chamado não encontrado',
  TICKET_INVALID_TYPE: 'Tipo de chamado inválido',
  TICKET_PHOTO_NOT_FOUND: 'Foto não encontrada ou não pertence ao usuário',
  TICKET_INVALID_STATUS_TRANSITION: 'Transição de status inválida',
  TICKET_USER_WITHOUT_CITY:
    'Cidadão sem cidade associada não pode criar chamados',
});
