import { ApiProperty } from '@nestjs/swagger';

export class CityResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({
    description:
      'Quantidade de administradores ativos (role ADMIN com email verificado).',
    example: 2,
  })
  adminCount!: number;
}
