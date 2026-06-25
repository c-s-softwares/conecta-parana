import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeltaStatDto {
  @ApiProperty({ example: 86, description: 'Total acumulado' })
  total!: number;

  @ApiProperty({ example: 7, description: 'Criados no mês atual' })
  thisMonth!: number;

  @ApiProperty({ example: 6, description: 'Criados no mês anterior' })
  lastMonth!: number;

  @ApiProperty({
    example: 1,
    description: 'Diferença absoluta (thisMonth - lastMonth)',
  })
  delta!: number;

  @ApiPropertyOptional({
    example: 16.7,
    nullable: true,
    description:
      'Variação percentual em relação ao mês anterior. Null quando não há dados anteriores.',
  })
  deltaPercent!: number | null;
}

export class DashboardMetricsResponseDto {
  @ApiProperty({ type: DeltaStatDto })
  communicates!: DeltaStatDto;

  @ApiProperty({
    type: DeltaStatDto,
    description: 'Eventos ativos (isActive: true, não deletados)',
  })
  events!: DeltaStatDto;

  @ApiProperty({ type: DeltaStatDto })
  locals!: DeltaStatDto;

  @ApiProperty({ type: DeltaStatDto })
  notifications!: DeltaStatDto;
}
