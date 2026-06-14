import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsBooleanString, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../../common/dto/request/pagination-query.dto';

export class QueryNewsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'cit_01HZ...',
    description: 'Filtrar notícias por cidade',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    example: 'saude',
    enum: ['saude', 'educacao', 'infra', 'geral', 'outros'],
    description: 'Filtrar notícias por tipo',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filtrar notícias ativas/inativas',
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
