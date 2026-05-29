import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  type!: string;

  @IsString()
  status!: string;

  @IsDateString()
  eventDate!: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  localId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];
}
