import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService, SearchResults } from './search.service';
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
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca agrupados por tipo de entidade.',
  })
  async search(@Query() query: SearchQueryDto): Promise<SearchResults> {
    return this.searchService.search(query);
  }
}
