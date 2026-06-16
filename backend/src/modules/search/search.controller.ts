import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Busca global textual',
    description:
      'Busca em Eventos, Comunicados, Notícias e Locais usando pg_trgm. Retorna dados agrupados.',
  })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
