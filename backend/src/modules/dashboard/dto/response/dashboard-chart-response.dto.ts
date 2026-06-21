import { ApiProperty } from '@nestjs/swagger';

export class ChartBucketDto {
  @ApiProperty({
    example: '2026-05-01T00:00:00.000Z',
    description: 'Início do período (truncado)',
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
  @ApiProperty({ enum: ['month', 'week'], example: 'month' })
  period!: 'month' | 'week';

  @ApiProperty({ type: [ChartBucketDto] })
  buckets!: ChartBucketDto[];
}
