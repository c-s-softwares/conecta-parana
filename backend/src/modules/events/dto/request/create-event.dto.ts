import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    example: 'Festival de Inverno',
    description: 'Título do evento',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'Um evento muito legal com várias atrações',
    description: 'Descrição detalhada do evento',
  })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'CULTURAL', description: 'Tipo do evento' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 'SCHEDULED', description: 'Status do evento' })
  @IsString()
  status!: string;

  @ApiProperty({
    example: '2025-12-01T10:00:00Z',
    description: 'Data e hora do evento (ISO 8601)',
  })
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({
    example: 'city_01HZX...',
    description: 'ID da cidade associada',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    example: 'local_01HZX...',
    description: 'ID do local físico do evento',
  })
  @IsOptional()
  @IsString()
  localId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Lista de IDs de fotos anexadas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];
}
