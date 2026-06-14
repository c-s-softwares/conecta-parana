import { ApiProperty } from '@nestjs/swagger';

export class NewsResponse {
  @ApiProperty({
    example: 'nws_01HZ...',
    description: 'ID único da notícia',
  })
  id!: string;

  @ApiProperty({
    example: 'Vacinação amanhã',
    description: 'Título da notícia',
  })
  title!: string;

  @ApiProperty({
    example: 'A vacinação ocorrerá às 08h.',
    description: 'Descrição da notícia',
  })
  description!: string;

  @ApiProperty({
    example: 'saude',
    enum: ['saude', 'educacao', 'infra', 'geral', 'outros'],
    description: 'Tipo da notícia',
  })
  type!: string;

  @ApiProperty({
    example: 'interno',
    enum: ['interno', 'externo'],
    description: 'Tipo de link da notícia',
  })
  linkType!: string;

  @ApiProperty({
    example: true,
    description: 'Indica se a notícia está ativa',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 'cit_01HZ...',
    description: 'Cidade relacionada à notícia',
  })
  cityId!: string;

  @ApiProperty({
    example: '2026-06-08T01:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-06-08T01:00:00.000Z',
  })
  updatedAt!: Date;
}
