import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryChartDto {
  @ApiPropertyOptional({
    enum: ['week', 'month', 'year'],
    example: 'month',
    description: 'Granularidade do agrupamento temporal',
  })
  @IsOptional()
  @IsIn(['week', 'month', 'year'])
  period?: 'week' | 'month' | 'year';
}
