import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'Festival de Inverno',
    description: 'Título do evento',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Um evento muito legal',
    description: 'Descrição detalhada do evento',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'CULTURAL', description: 'Tipo do evento' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'SCHEDULED',
    description: 'Status do evento',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00Z',
    description: 'Data e hora do evento (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

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
    example: '2025-10-01T10:00:00Z',
    description: 'Timestamp de controle para lock otimista',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Lista de IDs de fotos anexadas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];
}
