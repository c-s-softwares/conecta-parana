import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FeedService } from './feed.service';
import { QueryFeedDto } from './dto/request/query-feed.dto';
import { FeedResponseDto } from './dto/response/feed-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Feed combinado da Home Mobile por cidade',
    description:
      'Devolve a notícia ativa mais recente, até 4 eventos relevantes e até 4 comunicados ativos da cidade. Resposta em payload sectioned (sem paginação).',
  })
  @ApiResponse({
    status: 200,
    description: 'Feed retornado com sucesso',
    type: FeedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'validation_failed' })
  @ApiResponse({ status: 404, description: 'city_not_found' })
  getFeed(@Query() query: QueryFeedDto): Promise<FeedResponseDto> {
    return this.feedService.getFeed(query);
  }
}
