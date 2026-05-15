import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 'Paiçandu', minLength: 2, maxLength: 100 })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'PR', description: 'Sigla do estado (2 caracteres)' })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Length(2, 2)
  state!: string;
}
