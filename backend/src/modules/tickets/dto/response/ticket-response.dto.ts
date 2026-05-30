import { ApiProperty } from '@nestjs/swagger';
import { CoordinatesDto } from '../request/create-ticket.dto';

export class TicketResponseDto {
  @ApiProperty({ example: 'tkt_01HZ...' })
  id!: string;

  @ApiProperty({ example: 'sinalização' })
  type!: string;

  @ApiProperty({ example: 'Semáforo apagado' })
  title!: string;

  @ApiProperty({ example: 'Av. Brasil, esquina X' })
  description!: string;

  @ApiProperty({ example: 'aberto' })
  status!: string;

  @ApiProperty({ type: CoordinatesDto, required: false, nullable: true })
  coordinates?: CoordinatesDto | null;

  @ApiProperty({ example: 'Av. Brasil, 1000', required: false, nullable: true })
  address?: string | null;

  @ApiProperty({ example: 'cit_PAIC' })
  cityId!: string;

  @ApiProperty({ example: 'usr_...' })
  userId!: string;

  @ApiProperty({ example: 'usr_...', required: false, nullable: true })
  assignedToId?: string | null;

  @ApiProperty({ example: '2026-05-09T13:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-09T13:00:00Z' })
  updatedAt!: Date;

  @ApiProperty({
    example: '2026-05-09T14:00:00Z',
    required: false,
    nullable: true,
  })
  resolvedAt?: Date | null;

  @ApiProperty({ example: ['pho_...'], type: [String], required: false })
  photoIds?: string[];
}
