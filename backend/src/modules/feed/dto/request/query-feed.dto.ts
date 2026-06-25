import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsTablePrefixedUlid } from '../../../../common/validators/is-table-prefixed-ulid.validator';
import { TABLE_PREFIX } from '../../../../common/types/ulid.types';

export class QueryFeedDto {
  @ApiProperty({
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
    description: 'ULID da cidade (prefixo cit_).',
  })
  @IsString()
  @IsNotEmpty()
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId!: string;

  @ApiPropertyOptional({
    example: -23.45,
    minimum: -90,
    maximum: 90,
    description: 'Latitude para tie-break por proximidade entre eventos.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: -51.95,
    minimum: -180,
    maximum: 180,
    description: 'Longitude. Exige lat informado.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}
