import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { IsTablePrefixedUlid } from '../../../common/validators/is-table-prefixed-ulid.validator';
import { TABLE_PREFIX } from '../../../common/types/ulid.types';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Termo de busca. Mínimo de 3 caracteres.',
    example: 'feira',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({
    description: 'Filtrar resultados por uma cidade específica (ULID).',
    example: 'cit_01HGW...',
  })
  @IsOptional()
  @IsString()
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId?: string;

  @ApiPropertyOptional({
    description:
      'Tipos de entidades para buscar separados por vírgula (events,communicates,news,locals).',
    example: 'events,locals',
  })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiPropertyOptional({
    description: 'Limite de resultados por cada grupo.',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
