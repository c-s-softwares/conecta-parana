import { defineErrors } from '../../common/errors/define-errors';

export const USERS_ERRORS = defineErrors({
  UPDATE_TOO_FREQUENT:
    'Cidade já foi atualizada há menos de 60 segundos. Tente novamente em instantes.',
});
