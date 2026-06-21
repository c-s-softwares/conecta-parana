import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../common/dto/request/pagination-query.dto';

export class QueryEventsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'cit_01HZX...',
    description: 'Filtrar por cidade',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    example: 'cat_01HZX...',
    description: 'Filtrar por categoria do local',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00Z',
    description: 'Data inicial para o filtro',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Data final para o filtro',
  })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    example: 'cultural',
    description: 'Filtrar por tipo do evento',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrar por eventos ativos (true) ou inativos (false)',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '-25.4284',
    description: 'Latitude para busca por proximidade',
  })
  @IsOptional()
  @IsString()
  lat?: string;

  @ApiPropertyOptional({
    example: '-49.2733',
    description: 'Longitude para busca por proximidade',
  })
  @IsOptional()
  @IsString()
  lng?: string;

  @ApiPropertyOptional({
    enum: ['date_asc', 'date_desc'],
    example: 'date_asc',
    description: 'Ordenação dos resultados',
  })
  @IsOptional()
  @IsIn(['date_asc', 'date_desc'])
  order?: string;
}
