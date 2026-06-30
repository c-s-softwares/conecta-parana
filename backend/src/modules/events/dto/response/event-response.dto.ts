import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PhotoSummaryDto,
  PhotoThumbDto,
} from '../../../../common/dto/response/photo.dto';
import { UserSummaryDto } from '../../../../common/dto/response/user-summary.dto';

export class EventResponse {
  @ApiProperty({ example: 'event_01HZX...', description: 'ID do evento' })
  id!: string;

  @ApiProperty({
    example: 'Festival de Inverno',
    description: 'Título do evento',
  })
  title!: string;

  @ApiProperty({
    example: 'Um evento muito legal',
    description: 'Descrição detalhada do evento',
  })
  description!: string;

  @ApiProperty({ example: 'cultural', description: 'Tipo do evento' })
  type!: string;

  @ApiProperty({ example: true, description: 'Indica se o evento está ativo' })
  isActive!: boolean;

  @ApiProperty({
    example: '2025-12-01T10:00:00Z',
    description: 'Data e hora do evento',
  })
  eventDate!: Date;

  @ApiProperty({
    example: 'city_01HZX...',
    description: 'ID da cidade associada',
  })
  cityId!: string;

  @ApiProperty({
    example: 'user_01HZX...',
    description: 'ID do usuário criador',
  })
  userId!: string;

  @ApiPropertyOptional({
    type: () => UserSummaryDto,
    nullable: true,
    description: 'Admin autor do evento. Null quando o autor foi removido.',
  })
  user?: UserSummaryDto | null;

  @ApiPropertyOptional({
    example: 'local_01HZX...',
    description: 'ID do local do evento (se houver)',
  })
  localId?: string | null;

  @ApiProperty({
    example: '2025-01-01T10:00:00Z',
    description: 'Data de criação',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2025-01-01T10:00:00Z',
    description: 'Data da última alteração',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: [PhotoThumbDto],
    description: 'Fotos do evento em formato leve (apenas miniatura)',
  })
  photos!: PhotoThumbDto[];
}

export class EventDetailResponse extends EventResponse {
  @ApiProperty({
    type: [PhotoSummaryDto],
    description: 'Fotos do evento com imagem cheia (url) e miniatura',
  })
  declare photos: PhotoSummaryDto[];

  @ApiProperty({
    example: 12,
    description: 'Total de likes no evento.',
  })
  likesCount!: number;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário autenticado deu like no evento. Sempre false para anônimos.',
  })
  liked!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário autenticado salvou o evento. Sempre false para anônimos.',
  })
  saved!: boolean;
}
