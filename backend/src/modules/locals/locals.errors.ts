import { defineErrors } from '../../common/errors/define-errors';

export const LOCALS_ERRORS = defineErrors({
  LOCAL_NOT_FOUND: 'Local não encontrado',
  INVALID_COORDINATES:
    'Coordenadas inválidas (latitude deve ser entre -90 e 90, longitude entre -180 e 180)',
  RADIUS_TOO_LARGE: 'Raio máximo de busca permitido de 50km (50000 metros)',
});
