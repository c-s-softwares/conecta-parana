import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ENTITY_TYPE_VALUES } from '../../constants/entity-type';
import type { EntityType } from '../../constants/entity-type';

export class UploadPhotoDto {
  @ApiProperty({
    enum: ENTITY_TYPE_VALUES,
    description: 'Tipo da entidade alvo. user_avatar dispensa entityId.',
  })
  @IsString()
  @IsIn(ENTITY_TYPE_VALUES, {
    message: 'entityType inválido',
  })
  entityType!: EntityType;

  @ApiProperty({
    required: false,
    example: 'evt_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
    description:
      'ULID da entidade alvo. Obrigatório para event, local, ticket, news e communicate; ignorado para user_avatar.',
  })
  @IsOptional()
  @IsString()
  entityId?: string;
}
