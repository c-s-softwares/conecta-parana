import { ApiProperty } from '@nestjs/swagger';
import { PhotoResponseDto } from '../../../uploads/dto/response/photo-response.dto';

export class CommunicateResponse {
  @ApiProperty({
    example: 'cmt_01HZ...',
  })
  id!: string;

  @ApiProperty({
    example: 'Nova ferramenta disponível',
  })
  title!: string;

  @ApiProperty({
    example: 'A nova ferramenta já está disponível para os cidadãos.',
  })
  description!: string;

  @ApiProperty({
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    example: 'cit_01HZ...',
  })
  cityId!: string;

  @ApiProperty({
    example: 'usr_01HZ...',
  })
  userId!: string;
}

export class CommunicateDetailResponse extends CommunicateResponse {
  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome do administrador que publicou o comunicado.',
  })
  authorName!: string;

  @ApiProperty({
    type: () => [PhotoResponseDto],
    description: 'Fotos anexadas ao comunicado (max 10).',
  })
  photos!: PhotoResponseDto[];

  @ApiProperty({
    example: 12,
    description: 'Total de likes no comunicado.',
  })
  likesCount!: number;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário autenticado deu like. Sempre false para anônimos.',
  })
  liked!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário autenticado salvou. Sempre false para anônimos.',
  })
  saved!: boolean;
}
