import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsTablePrefixedUlid } from '../../../common/validators/is-table-prefixed-ulid.validator';
import { TABLE_PREFIX } from '../../../common/types/ulid.types';

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
  name!: string;

  @ApiProperty({
    description: 'Email institucional do administrador (deve ser único)',
    example: 'joao@maringa.pr.gov.br',
  })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    description: 'ULID da cidade à qual o admin será vinculado (prefixo cit_)',
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  @IsNotEmpty()
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId!: string;
}
