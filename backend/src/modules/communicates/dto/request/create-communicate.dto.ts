import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateCommunicateDto {
  @ApiProperty({
    example: 'Nova ferramenta disponível',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200)
  title!: string;

  @ApiProperty({
    example: 'A nova ferramenta já está disponível para os cidadãos.',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'cit_01HZ...',
    description:
      'Obrigatório apenas para Super Admin. Para ADMIN, será usado o cityId do JWT.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^cit_[A-Za-z0-9]+$/, {
    message: 'cityId deve ser um ULID válido com prefixo cit_',
  })
  cityId?: string;
}
