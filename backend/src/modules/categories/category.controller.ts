import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

import { CategoryService } from './category.service';

import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';

import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { Public } from '../../common/decorators/public.decorator';

import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';

import { CACHE_TTL_1_HOUR } from '../../common/constants/cache.constants';

import { CategoryResponse } from './dto/response/response-category.dto';

@ApiTags('categories')
@UseInterceptors(CacheInterceptor)
@CacheTTL(CACHE_TTL_1_HOUR)
@Controller('categories')
export class CategoryController extends BaseCrudController<
  CategoryResponse,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor(private readonly categoryService: CategoryService) {
    super(categoryService);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar categorias com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de categorias' })
  override findAll(@Query() query: PaginationQueryDto) {
    return super.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  override findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Categoria já existe' })
  override create(@Body() dto: CreateCategoryDto) {
    return super.create(dto);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  override update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar categoria' })
  @ApiResponse({ status: 204, description: 'Categoria deletada com sucesso' })
  @ApiResponse({
    status: 409,
    description: 'Categoria possui locais associados',
  })
  override remove(@Param('id') id: string) {
    return super.remove(id);
  }
}
