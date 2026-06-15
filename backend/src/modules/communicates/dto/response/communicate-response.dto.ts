import { ApiProperty } from '@nestjs/swagger';

export class CommunicateResponse {
  @ApiProperty({
    example: 'cmt_01HZ...',
  })
  id!: string;

  @ApiProperty({
    example: 'Nova ferramenta disponível',
  })
  title!: string;

  @ApiProperty({
    example: 'A nova ferramenta já está disponível para os cidadãos.',
  })
  description!: string;

  @ApiProperty({
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    example: 'cit_01HZ...',
  })
  cityId!: string;

  @ApiProperty({
    example: 'usr_01HZ...',
  })
  userId!: string;
}
