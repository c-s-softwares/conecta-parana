import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketCommentDto {
  @ApiProperty({
    example: 'Já enviamos uma equipe de iluminação para o local.',
    description: 'Mensagem do comentário',
  })
  @IsNotEmpty({ message: 'A mensagem do comentário é obrigatória' })
  @IsString({ message: 'A mensagem do comentário deve ser uma string' })
  message!: string;

  @ApiProperty({
    example: false,
    description: 'Se o comentário é interno (apenas visível para administradores)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'O campo isInternal deve ser um booleano' })
  isInternal?: boolean;
}
