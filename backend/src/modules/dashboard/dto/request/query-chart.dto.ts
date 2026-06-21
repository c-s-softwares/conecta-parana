import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryChartDto {
  @ApiPropertyOptional({
    enum: ['month', 'week'],
    example: 'month',
    description: 'Granularidade do agrupamento temporal',
  })
  @IsOptional()
  @IsIn(['month', 'week'])
  period?: 'month' | 'week';
}
