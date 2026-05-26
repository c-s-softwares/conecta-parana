import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TABLE_PREFIX } from '../../../../common/types/ulid.types';
import { IsTablePrefixedUlid } from '../../../../common/validators/is-table-prefixed-ulid.validator';

export class NearbyQueryDto {
  @ApiProperty({
    example: -23.45,
    description: 'Latitude central de busca (-90 a 90)',
  })
  @IsNotEmpty({ message: 'A latitude é obrigatória' })
  @IsNumber({}, { message: 'A latitude deve ser um número' })
  @Type(() => Number)
  lat!: number;

  @ApiProperty({
    example: -51.95,
    description: 'Longitude central de busca (-180 a 180)',
  })
  @IsNotEmpty({ message: 'A longitude é obrigatória' })
  @IsNumber({}, { message: 'A longitude deve ser um número' })
  @Type(() => Number)
  lng!: number;

  @ApiProperty({
    example: 2000,
    description: 'Raio de busca em metros (máximo 50000m / 50km)',
  })
  @IsNotEmpty({ message: 'O raio de busca é obrigatório' })
  @IsNumber({}, { message: 'O raio de busca deve ser um número' })
  @Type(() => Number)
  radius!: number;

  @ApiProperty({
    example: 'cat_01HZX3Y4Q9F8TAB1C2DKEYH9XY',
    description: 'ID da categoria para filtrar locais (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O ID da categoria deve ser uma string' })
  @IsTablePrefixedUlid(TABLE_PREFIX.CATEGORY)
  categoryId?: string;
}
