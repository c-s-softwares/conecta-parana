import { ApiProperty } from '@nestjs/swagger';
import type { EntityType } from '../../constants/entity-type';

export class PhotoResponseDto {
  @ApiProperty({ example: 'pho_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  id!: string;

  @ApiProperty({
    example:
      'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/ns/b/bucket/o/photos/event/evt_x/pho_y.webp',
  })
  url!: string;

  @ApiProperty({
    example:
      'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/ns/b/bucket/o/photos/event/evt_x/pho_y-thumb.webp',
    required: false,
    nullable: true,
  })
  thumbUrl!: string | null;

  @ApiProperty({ enum: ['event', 'local', 'ticket', 'user_avatar'] })
  entityType!: EntityType;

  @ApiProperty({
    example: 'evt_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
    description: 'ID da entidade alvo (ou do usuário, para user_avatar)',
  })
  entityId!: string;
}
