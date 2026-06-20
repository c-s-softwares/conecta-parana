import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
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
    description:
      'Define se a notícia abre internamente (tela de detalhe no mobile) ou externamente (linkUrl no navegador).',
    enum: ['interno', 'externo'],
  })
  @IsString()
  linkType!: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/noticia',
    description:
      'URL externa da notícia. Obrigatório quando linkType=externo; ignorado quando linkType=interno.',
  })
  @ValidateIf((o: CreateNewsDto) => o.linkType === 'externo')
  @IsString()
  @IsNotEmpty({ message: 'linkUrl é obrigatório quando linkType=externo' })
  @IsUrl({}, { message: 'linkUrl deve ser uma URL válida' })
  linkUrl?: string;

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
