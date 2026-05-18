import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({
    example: 'ALGM Token',
    description: 'O refresh token ativo que deve ser revogado',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
