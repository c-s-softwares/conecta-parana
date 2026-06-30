import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoResponseDto } from '../../../uploads/dto/response/photo-response.dto';
import { PhotoThumbDto } from '../../../../common/dto/response/photo.dto';
import { UserSummaryDto } from '../../../../common/dto/response/user-summary.dto';

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

  @ApiPropertyOptional({
    type: () => UserSummaryDto,
    nullable: true,
    description: 'Admin autor do comunicado. Null quando o autor foi removido.',
  })
  user?: UserSummaryDto | null;

  @ApiProperty({
    type: [PhotoThumbDto],
    description: 'Fotos do comunicado em formato leve (apenas miniatura).',
  })
  photos!: PhotoThumbDto[];
}

export class CommunicateDetailResponse extends CommunicateResponse {

  @ApiProperty({
    type: () => [PhotoResponseDto],
    description: 'Fotos anexadas ao comunicado (max 10).',
  })
  declare photos: PhotoResponseDto[];

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
