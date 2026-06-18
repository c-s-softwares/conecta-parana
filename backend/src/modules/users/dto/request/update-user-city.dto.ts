import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsTablePrefixedUlid } from '../../../../common/validators/is-table-prefixed-ulid.validator';
import { TABLE_PREFIX } from '../../../../common/types/ulid.types';

export class UpdateUserCityDto {
  @ApiProperty({
    description: 'ULID da nova cidade do usuário (deve começar com cit_)',
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  @IsNotEmpty({ message: 'O campo cityId é obrigatório' })
  @IsTablePrefixedUlid(TABLE_PREFIX.CITY)
  cityId!: string;
}
