import { defineErrors } from '../../common/errors/define-errors';

export const EVENT_ERRORS = defineErrors({
  EVENT_NOT_FOUND: 'Evento não encontrado',
  EVENT_CHANGED: 'Evento alterado por outro processo',
  EVENT_DATE_IN_PAST: 'Data do evento não pode estar no passado',
  INVALID_EVENT_TYPE: 'Tipo de evento inválido',
  INVALID_STATUS: 'Status de evento inválido',
  COORDINATES_LOCAL_MISMATCH:
    'As coordenadas informadas diferem do local informado',
});
