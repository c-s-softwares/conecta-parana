import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TABLE_PREFIX } from '../../../../common/types/ulid.types';
import { IsTablePrefixedUlid } from '../../../../common/validators/is-table-prefixed-ulid.validator';

export class CreateLocalDto {
  @ApiProperty({
    example: 'UPA Centro',
    description: 'Nome do local',
  })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @ApiProperty({
    example: 'Unidade de Pronto Atendimento 24h',
    description: 'Descrição do local',
  })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @IsString({ message: 'A descrição deve ser uma string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description!: string;

  @ApiProperty({
    example: 'Rua das Flores, 123 - Centro',
    description: 'Endereço do local',
  })
  @IsNotEmpty({ message: 'O endereço é obrigatório' })
  @IsString({ message: 'O endereço deve ser uma string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  address!: string;

  @ApiProperty({
    example: '(44) 3221-1234',
    description: 'Telefone de contato',
  })
  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  @IsString({ message: 'O telefone deve ser uma string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone!: string;

  @ApiProperty({
    example: -23.45,
    description: 'Latitude da localização (entre -90 e 90)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'A latitude deve ser um número' })
  @Min(-90, { message: 'A latitude mínima é -90' })
  @Max(90, { message: 'A latitude máxima é 90' })
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({
    example: -51.95,
    description: 'Longitude da localização (entre -180 e 180)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'A longitude deve ser um número' })
  @Min(-180, { message: 'A longitude mínima é -180' })
  @Max(180, { message: 'A longitude máxima é 180' })
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
    description: 'ID da cidade (ULID prefixado com cit_)',
  })
  @IsNotEmpty({ message: 'O ID da cidade é obrigatório' })
  @IsString({ message: 'O ID da cidade deve ser uma string' })
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId!: string;

  @ApiProperty({
    example: 'cat_01HZX3Y4Q9F8TAB1C2DKEYH9XY',
    description: 'ID da categoria (ULID prefixado com cat_)',
  })
  @IsNotEmpty({ message: 'O ID da categoria é obrigatório' })
  @IsString({ message: 'O ID da categoria deve ser uma string' })
  @IsTablePrefixedUlid(TABLE_PREFIX.CATEGORY)
  categoryId!: string;
}
