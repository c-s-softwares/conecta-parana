import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestionDto {
  @ApiProperty({
    example: 'Praça nova',
    description: 'Assunto da sugestão',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'O assunto é obrigatório' })
  @IsString({ message: 'O assunto deve ser uma string' })
  subject!: string;

  @ApiProperty({
    example: 'Seria ótimo ter uma praça no Jardim Aclimação',
    description: 'Mensagem/detalhes da sugestão',
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'A mensagem é obrigatória' })
  @IsString({ message: 'A mensagem deve ser uma string' })
  message!: string;
}
