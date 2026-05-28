import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondSuggestionDto {
  @ApiProperty({
    example: 'Obrigado, vamos avaliar.',
    description: 'Resposta do administrador para a sugestão',
  })
  @IsNotEmpty({ message: 'A resposta é obrigatória' })
  @IsString({ message: 'A resposta deve ser uma string' })
  response!: string;
}
