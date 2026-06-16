import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserCityResponseDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  id!: string;

  @ApiProperty({
    description: 'ID da cidade associada',
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  cityId!: string;

  @ApiProperty({
    description: 'Data e hora da última atualização de cidade',
    example: '2026-05-09T14:00:00.000Z',
  })
  lastCityUpdateAt!: Date;
}
