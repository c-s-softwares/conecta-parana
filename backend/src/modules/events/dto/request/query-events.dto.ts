import { IsIn, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../../common/dto/request/pagination-query.dto';

export class QueryEventsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  lat?: string;

  @IsOptional()
  @IsString()
  lng?: string;

  @IsOptional()
  @IsIn(['date_asc', 'date_desc', 'nearest'])
  order?: string;
}
