import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class UpdateCommunicateDto {
  @ApiPropertyOptional({
    example: 'Título atualizado',
    minLength: 5,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(5, 200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Descrição atualizada do comunicado.',
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}