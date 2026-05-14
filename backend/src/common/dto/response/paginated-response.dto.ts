import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Lista de itens da página atual' })
  items!: T[];

  @ApiProperty({ description: 'Total de itens no banco', example: 42 })
  total!: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 10 })
  pageSize!: number;
}
