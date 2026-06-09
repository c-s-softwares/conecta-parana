import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketCommentDto {
  @ApiProperty({
    example: 'Já enviamos uma equipe de iluminação para o local.',
    description: 'Mensagem do comentário',
  })
  @IsNotEmpty({ message: 'A mensagem do comentário é obrigatória' })
  @IsString({ message: 'A mensagem do comentário deve ser uma string' })
  message!: string;
}
