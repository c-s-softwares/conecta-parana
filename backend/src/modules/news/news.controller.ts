import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { AdminRoute } from '../../common/decorators/admin-route.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/request/create-news.dto';
import { UpdateNewsDto } from './dto/request/update-news.dto';
import { QueryNewsDto } from './dto/request/query-news.dto';
import { NewsResponse } from './dto/response/news-response.dto';

type AuthRequest = Request & {
  user?: JwtPayload;
};

@ApiTags('news')
@Controller('news')
export class NewsController extends BaseCrudController<
  NewsResponse,
  CreateNewsDto,
  UpdateNewsDto
> {
  constructor(private readonly newsService: NewsService) {
    super(newsService);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar notícias com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de notícias' })
  override findAll(@Query() query: QueryNewsDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Buscar notícia por ID' })
  @ApiResponse({ status: 200, description: 'Notícia encontrada' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  override findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post()
  @AdminRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar notícia' })
  @ApiResponse({ status: 201, description: 'Notícia criada com sucesso' })
  override create(@Body() dto: CreateNewsDto, @Req() req?: AuthRequest) {
    return this.newsService.create(dto, req?.user);
  }

  @Patch(':id')
  @AdminRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar notícia' })
  @ApiResponse({ status: 200, description: 'Notícia atualizada com sucesso' })
  override update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @Req() req?: AuthRequest,
  ) {
    return this.newsService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @AdminRoute()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar notícia' })
  @ApiResponse({ status: 204, description: 'Notícia deletada com sucesso' })
  override remove(@Param('id') id: string, @Req() req?: AuthRequest) {
    return this.newsService.remove(id, req?.user);
  }
}
