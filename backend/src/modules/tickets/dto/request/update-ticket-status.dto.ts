import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketStatusDto {
  @ApiProperty({
    example: 'em_análise',
    description: 'Novo status do chamado',
    enum: ['aberto', 'em_análise', 'resolvido', 'fechado', 'reaberto'],
  })
  @IsNotEmpty({ message: 'O status é obrigatório' })
  @IsString({ message: 'O status deve ser uma string' })
  @IsIn(['aberto', 'em_análise', 'resolvido', 'fechado', 'reaberto'], {
    message: 'Status inválido',
  })
  status!: string;

  @ApiProperty({
    example: 'usr_01HZX...',
    description: 'ID do administrador responsável pelo chamado',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O ID do responsável deve ser uma string' })
  assignedToId?: string | null;
}
