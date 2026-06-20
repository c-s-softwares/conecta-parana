import { ApiProperty } from '@nestjs/swagger';

export class TicketCommentResponseDto {
  @ApiProperty({ example: 'tkc_01HZ...' })
  id!: string;

  @ApiProperty({ example: 'tkt_01HZ...' })
  ticketId!: string;

  @ApiProperty({ example: 'usr_...' })
  authorId!: string;

  @ApiProperty({ example: 'Equipe enviada ao local.' })
  message!: string;

  @ApiProperty({ example: '2026-05-09T13:05:00Z' })
  createdAt!: Date;
}
