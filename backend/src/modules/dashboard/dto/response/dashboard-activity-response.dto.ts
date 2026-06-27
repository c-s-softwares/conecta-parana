import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardActivityItemDto {
  @ApiProperty({ example: 'com_01HZX...', description: 'ID do registro' })
  id!: string;

  @ApiProperty({ enum: ['communicate', 'event', 'news'], example: 'event' })
  type!: 'communicate' | 'event' | 'news';

  @ApiProperty({
    example: 'Festival de Inverno',
    description: 'Título do registro',
  })
  title!: string;

  @ApiProperty({ example: 'Maringá', description: 'Nome da cidade' })
  cityName!: string;

  @ApiPropertyOptional({
    example: 'Admin Maringá',
    nullable: true,
    description: 'Nome do usuário que criou o registro',
  })
  createdBy!: string | null;

  @ApiProperty({
    example: '2026-06-01T10:00:00.000Z',
    description: 'Data de criação',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-06-21T14:30:00.000Z',
    description: 'Data da última alteração',
  })
  updatedAt!: string;
}
