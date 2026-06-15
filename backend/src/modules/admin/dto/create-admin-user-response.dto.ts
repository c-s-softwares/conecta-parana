import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateAdminUserResponseDto {
  @ApiProperty({
    description: 'ULID do usuário criado',
    example: 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do administrador',
    example: 'João da Silva',
  })
  name!: string;

  @ApiProperty({
    description: 'Email do administrador',
    example: 'joao@maringa.pr.gov.br',
  })
  email!: string;

  @ApiProperty({
    description: 'ULID da cidade à qual o admin foi vinculado',
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
  })
  cityId!: string;

  @ApiProperty({
    description: 'Role do usuário criado',
    enum: Role,
    example: Role.ADMIN,
  })
  role!: Role;

  @ApiProperty({
    description:
      'Indica se o email de boas-vindas foi enviado com sucesso. ' +
      'Quando false, a criação foi bem-sucedida mas o email falhou — ' +
      'acione o reenvio manual.',
    example: true,
  })
  emailSent!: boolean;
}
