import { ApiProperty } from '@nestjs/swagger';

export class CityStatsResponse {
  @ApiProperty({
    description: 'Total de cidades ativas (nao deletadas) na plataforma.',
    example: 47,
  })
  total!: number;

  @ApiProperty({
    description:
      'Cidades com ao menos um administrador ativo (role ADMIN com email verificado).',
    example: 38,
  })
  withActiveAdmin!: number;

  @ApiProperty({
    description:
      'Cidades sem nenhum administrador ativo (aguardando cadastro).',
    example: 9,
  })
  awaitingAdmin!: number;
}
