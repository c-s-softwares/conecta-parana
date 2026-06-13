import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminUserDto {
  @ApiProperty({
    description: 'Nome completo do administrador',
    example: 'João da Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @ApiProperty({
    description: 'Email institucional do administrador (deve ser único)',
    example: 'joao@maringa.pr.gov.br',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'ULID da cidade à qual o admin será vinculado (prefixo cit_)',
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  @IsString()
  @Matches(/^cit_/, {
    message: 'cityId deve ser um ULID de cidade válido (prefixo cit_)',
  })
  cityId: string;
}
