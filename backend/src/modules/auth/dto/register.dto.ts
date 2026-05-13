import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TABLE_PREFIX } from '../../../common/types/ulid.types';
import { IsTablePrefixedUlid } from '../../../common/validators/is-table-prefixed-ulid.validator';

export class RegisterDto {
  @ApiProperty({ example: 'Johnny CuteBottom' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'johnny.cutebottom@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN', required: false })
  @IsOptional()
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId?: string;
}
