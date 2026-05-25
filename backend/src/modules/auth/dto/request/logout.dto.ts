import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhb...9mjs0',
    description: 'O refresh token ativo que deve ser revogado',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
