import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoResponseDto } from '../../../uploads/dto/response/photo-response.dto';
import { PhotoThumbDto } from '../../../../common/dto/response/photo.dto';

export class NewsResponse {
  @ApiProperty({
    example: 'nws_01HZ...',
    description: 'ID único da notícia',
  })
  id!: string;

  @ApiProperty({
    example: 'Vacinação amanhã',
    description: 'Título da notícia',
  })
  title!: string;

  @ApiProperty({
    example: 'A vacinação ocorrerá às 08h.',
    description: 'Descrição da notícia',
  })
  description!: string;

  @ApiProperty({
    example: 'saude',
    enum: ['saude', 'educacao', 'infra', 'geral', 'outros'],
    description: 'Tipo da notícia',
  })
  type!: string;

  @ApiProperty({
    example: 'interno',
    enum: ['interno', 'externo'],
    description:
      'Tipo de link da notícia. interno abre a tela de detalhe no mobile; externo abre linkUrl no navegador.',
  })
  linkType!: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/noticia',
    description:
      'URL externa da notícia. Obrigatório quando linkType=externo; null/undefined quando linkType=interno.',
    nullable: true,
  })
  linkUrl?: string | null;

  @ApiProperty({
    example: true,
    description: 'Indica se a notícia está ativa',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 'cit_01HZ...',
    description: 'Cidade relacionada à notícia',
  })
  cityId!: string;

  @ApiPropertyOptional({
    example: 'usr_01HZ...',
    nullable: true,
    description: 'Usuário que criou a notícia',
  })
  userId?: string | null;

  @ApiProperty({
    example: '2026-06-08T01:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-06-08T01:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: [PhotoThumbDto],
    description: 'Fotos da notícia em formato leve (apenas miniatura).',
  })
  photos!: PhotoThumbDto[];
}

export class NewsDetailResponse extends NewsResponse {
  @ApiProperty({
    type: () => [PhotoResponseDto],
    description: 'Fotos anexadas à notícia (max 10).',
  })
  declare photos: PhotoResponseDto[];

  @ApiProperty({
    example: 12,
    description: 'Total de likes na notícia.',
  })
  likesCount!: number;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário autenticado deu like na notícia. Sempre false para anônimos.',
  })
  liked!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário autenticado salvou a notícia. Sempre false para anônimos.',
  })
  saved!: boolean;
}
