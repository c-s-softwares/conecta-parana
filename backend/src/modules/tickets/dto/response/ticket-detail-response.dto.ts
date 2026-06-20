import { ApiProperty } from '@nestjs/swagger';
import { TicketResponseDto } from './ticket-response.dto';
import { TicketCommentResponseDto } from './ticket-comment-response.dto';

export class TicketDetailResponseDto extends TicketResponseDto {
  @ApiProperty({
    type: [TicketCommentResponseDto],
    description: 'Lista de comentários do chamado',
  })
  comments!: TicketCommentResponseDto[];
}
