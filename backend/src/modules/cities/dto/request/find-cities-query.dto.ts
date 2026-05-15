import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/request/pagination-query.dto';
export class FindCitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Termo para busca por nome (ILIKE)',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
