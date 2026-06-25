import { ApiProperty } from '@nestjs/swagger';

export class DashboardTopCitiesItemDto {
  @ApiProperty({ example: 'cit_01HZX...', description: 'ID da cidade' })
  cityId!: string;

  @ApiProperty({ example: 'Maringá', description: 'Nome da cidade' })
  cityName!: string;

  @ApiProperty({ example: 42, description: 'Total de publicações na cidade' })
  total!: number;
}
