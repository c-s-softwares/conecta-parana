import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  ValidateNested,
  IsObject,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CoordinatesDto {
  @ApiProperty({ example: -23.45, description: 'Latitude (-90 a 90)' })
  @IsNumber({}, { message: 'A latitude deve ser um número' })
  @Min(-90, { message: 'A latitude mínima é -90' })
  @Max(90, { message: 'A latitude máxima é 90' })
  @Type(() => Number)
  lat!: number;

  @ApiProperty({ example: -51.95, description: 'Longitude (-180 a 180)' })
  @IsNumber({}, { message: 'A longitude deve ser um número' })
  @Min(-180, { message: 'A longitude mínima é -180' })
  @Max(180, { message: 'A longitude máxima é 180' })
  @Type(() => Number)
  lng!: number;
}

export class CreateTicketDto {
  @ApiProperty({
    example: 'sinalização',
    description: 'Tipo do chamado',
  })
  @IsNotEmpty({ message: 'O tipo é obrigatório' })
  @IsString({ message: 'O tipo deve ser uma string' })
  type!: string;

  @ApiProperty({
    example: 'Semáforo apagado',
    description: 'Título do chamado',
    minLength: 5,
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @IsString({ message: 'O título deve ser uma string' })
  @MinLength(5, { message: 'O título deve ter no mínimo 5 caracteres' })
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres' })
  title!: string;

  @ApiProperty({
    example: 'Av. Brasil, esquina X',
    description: 'Descrição do chamado',
    minLength: 10,
  })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @IsString({ message: 'A descrição deve ser uma string' })
  @MinLength(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
  description!: string;

  @ApiProperty({
    description: 'Coordenadas geográficas',
    type: CoordinatesDto,
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'As coordenadas devem ser um objeto' })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto | null;

  @ApiProperty({
    example: 'Av. Brasil, 1000',
    description: 'Endereço textual',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string' })
  address?: string | null;

  @ApiProperty({
    example: ['pho_01HZX...'],
    description: 'IDs de fotos associadas',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Os IDs de fotos devem ser uma lista' })
  @IsString({ each: true, message: 'Cada ID de foto deve ser uma string' })
  photoIds?: string[];
}
