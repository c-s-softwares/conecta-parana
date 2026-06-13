import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/request/pagination-query.dto';

export class QueryComunicadoDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'cit_01HZ...',
    description: 'Filtra comunicados por cidade.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^cit_[A-Za-z0-9]+$/, {
    message: 'cityId deve ser um ULID válido com prefixo cit_',
  })
  cityId?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filtra comunicados ativos ou inativos.',
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
