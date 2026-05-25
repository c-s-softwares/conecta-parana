import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutAllDto {
  @ApiProperty({
    example: 'senha123',
    description:
      'Senha atual do usuário para confirmar a revogação de todas as sessões',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
