import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({
    example: 'Vacinação amanhã',
    description: 'Título da notícia',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'A vacinação ocorrerá às 08h na Unidade Básica de Saúde.',
    description: 'Descrição da notícia',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({
    example: 'saude',
    description: 'Tipo da notícia',
    enum: ['saude', 'educacao', 'infra', 'geral', 'outros'],
  })
  @IsString()
  type!: string;

  @ApiProperty({
    example: 'interno',
    description: 'Define se a notícia abre internamente ou externamente',
    enum: ['interno', 'externo'],
  })
  @IsString()
  linkType!: string;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'cit_01HZ...',
    required: false,
  })
  @IsOptional()
  @IsString()
  cityId?: string;
}
