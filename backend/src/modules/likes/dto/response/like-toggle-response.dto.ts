import { ApiProperty } from '@nestjs/swagger';

export class LikeToggleResponseDto {
  @ApiProperty({
    example: true,
    description:
      'Indica se o usuário deu like (true) ou removeu o like (false)',
  })
  liked!: boolean;

  @ApiProperty({
    example: 42,
    description: 'Quantidade total de likes atualizada para o recurso',
  })
  count!: number;
}
