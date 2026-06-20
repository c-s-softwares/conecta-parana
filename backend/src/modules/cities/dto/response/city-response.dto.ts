import { ApiProperty } from '@nestjs/swagger';

export class CityResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  state!: string;
}
