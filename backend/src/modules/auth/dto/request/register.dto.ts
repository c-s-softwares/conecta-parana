import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TABLE_PREFIX } from '../../../../common/types/ulid.types';
import { IsTablePrefixedUlid } from '../../../../common/validators/is-table-prefixed-ulid.validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', minLength: 2, maxLength: 100 })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'Senha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password deve conter pelo menos 1 letra e 1 número',
  })
  password!: string;

  @ApiProperty({
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
    description: 'ID da cidade (ULID prefixado com cit_)',
  })
  @IsNotEmpty({ message: 'O campo de ID da cidade é obrigatório' })
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId!: string;
}
