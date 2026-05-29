import { ApiProperty } from '@nestjs/swagger';

export class CoordinatesDto {
  @ApiProperty({ example: -23.45 })
  lat!: number;

  @ApiProperty({ example: -51.95 })
  lng!: number;
}

export class LocalResponseDto {
  @ApiProperty({ example: 'loc_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  id!: string;

  @ApiProperty({ example: 'UPA Centro' })
  name!: string;

  @ApiProperty({ example: 'Unidade de Pronto Atendimento 24h' })
  description!: string;

  @ApiProperty({ example: 'Rua das Flores, 123 - Centro' })
  address!: string;

  @ApiProperty({ example: '(44) 3221-1234' })
  phone!: string;

  @ApiProperty({
    type: CoordinatesDto,
    required: false,
    nullable: true,
    description: 'Coordenadas geográficas do local',
  })
  coordinates?: CoordinatesDto | null;

  @ApiProperty({ example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  cityId!: string;

  @ApiProperty({ example: 'cat_01HZX3Y4Q9F8TAB1C2DKEYH9XY' })
  categoryId!: string;

  @ApiProperty({ example: 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9ZZ' })
  userId!: string;
}

export class LocalNearbyResponseDto extends LocalResponseDto {
  @ApiProperty({
    example: 350,
    description: 'Distância em metros até o ponto de busca',
  })
  distance!: number;
}
