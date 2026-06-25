import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsResponse } from '../../../news/dto/response/news-response.dto';
import { EventResponse } from '../../../events/dto/response/event-response.dto';
import { CommunicateResponse } from '../../../communicates/dto/response/communicate-response.dto';

export class FeedResponseDto {
  @ApiPropertyOptional({
    type: NewsResponse,
    nullable: true,
    description: 'Notícia ativa mais recente da cidade. Null se inexistente.',
  })
  mainNews!: NewsResponse | null;

  @ApiProperty({
    type: [EventResponse],
    description:
      'Até 4 eventos relevantes. Prioritários primeiro, depois janela [-1d, +7d] por eventDate ASC com tie-break por proximidade quando lat/lng informados.',
  })
  events!: EventResponse[];

  @ApiProperty({
    type: [CommunicateResponse],
    description:
      'Até 4 comunicados ativos mais recentes da cidade (ordem cronológica decrescente).',
  })
  communicates!: CommunicateResponse[];
}
