import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TABLE_PREFIX } from '../../../../common/types/ulid.types';
import { IsTablePrefixedUlid } from '../../../../common/validators/is-table-prefixed-ulid.validator';

export class CreateLikeToggleDto {
  @ApiPropertyOptional({
    example: 'evt_01HZX3Y4Q9F8TAB1C2DKEYH9ZZ',
    description: 'ID do Evento a receber like (ULID prefixado com evt_)',
  })
  @IsOptional()
  @IsString()
  @IsTablePrefixedUlid(TABLE_PREFIX.EVENT)
  eventId?: string;

  @ApiPropertyOptional({
    example: 'cmt_01HZX3Y4Q9F8TAB1C2DKEYH9ZZ',
    description: 'ID do Comunicado a receber like (ULID prefixado com cmt_)',
  })
  @IsOptional()
  @IsString()
  @IsTablePrefixedUlid(TABLE_PREFIX.COMMUNICATE)
  communicateId?: string;

  @ApiPropertyOptional({
    example: 'nws_01HZX3Y4Q9F8TAB1C2DKEYH9ZZ',
    description: 'ID da Notícia a receber like (ULID prefixado com nws_)',
  })
  @IsOptional()
  @IsString()
  @IsTablePrefixedUlid(TABLE_PREFIX.NEWS)
  newsId?: string;
}
