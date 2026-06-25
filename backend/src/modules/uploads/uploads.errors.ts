import { defineErrors } from '../../common/errors/define-errors';

export const UPLOADS_ERRORS = defineErrors({
  INVALID_FILE_TYPE: 'Tipo de arquivo não suportado. Aceitos: JPEG, PNG, WebP.',
  FILE_TOO_LARGE: 'Arquivo excede o limite de 5MB',
  FILE_REQUIRED: 'Arquivo é obrigatório no campo `file`',
  INVALID_ENTITY_TYPE:
    'entityType inválido. Valores aceitos: event, local, ticket, news, communicate, user_avatar.',
  ENTITY_ID_REQUIRED: 'entityId é obrigatório para o entityType informado',
  ENTITY_NOT_FOUND: 'Entidade alvo não encontrada',
  PHOTO_LIMIT_REACHED: 'Limite de 10 fotos por entidade atingido',
  PHOTO_NOT_FOUND: 'Foto não encontrada',
});
