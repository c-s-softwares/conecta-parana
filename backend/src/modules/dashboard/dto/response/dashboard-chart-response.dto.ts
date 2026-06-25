import { ApiProperty } from '@nestjs/swagger';

export class ChartBucketDto {
  @ApiProperty({
    example: '2026-05-01',
    description: 'Início do período no fuso do Brasil (YYYY-MM-DD)',
  })
  period!: string;

  @ApiProperty({
    example: 12,
    description: 'Comunicados publicados no período',
  })
  communicates!: number;

  @ApiProperty({ example: 4, description: 'Eventos criados no período' })
  events!: number;

  @ApiProperty({ example: 7, description: 'Notícias publicadas no período' })
  news!: number;
}

export class DashboardChartResponseDto {
  @ApiProperty({ enum: ['week', 'month', 'year'], example: 'month' })
  period!: 'week' | 'month' | 'year';

  @ApiProperty({ type: [ChartBucketDto] })
  buckets!: ChartBucketDto[];
}
