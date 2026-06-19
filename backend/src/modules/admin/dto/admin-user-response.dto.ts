import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AdminUserResponseDto {
  @ApiProperty({ example: 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  id!: string;

  @ApiProperty({ example: 'João da Silva' })
  name!: string;

  @ApiProperty({ example: 'joao@maringa.pr.gov.br' })
  email!: string;

  @ApiProperty({
    example: 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN',
    required: false,
    nullable: true,
    description:
      'ID da cidade. null para Super Admin (gestor global sem cidade fixa).',
  })
  cityId!: string | null;

  @ApiProperty({
    example: 'Maringá',
    required: false,
    nullable: true,
    description:
      'Nome da cidade vinculada. null para Super Admin (sem cidade).',
  })
  cityName!: string | null;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role!: Role;
}
