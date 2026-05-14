import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ example: 'seu_refresh_token_aqui' })
  @IsString()
  refresh_token!: string;
}
