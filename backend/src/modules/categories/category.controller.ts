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
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { Role } from '@prisma/client';

import { CategoryService } from './category.service';

import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
// TODO: trocar para SUPER_ADMIN quando role estiver disponível
import { Roles } from '../../common/decorators/roles.decorator';

import { BaseCrudController } from '../../common/controllers/base-crud.controller';

import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';

import { CategoryResponse } from './dto/response/response-category.dto';

@ApiTags('categories')
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
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  override findAll(@Query() query: PaginationQueryDto) {
    return super.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  override findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
  })
  override create(@Body() dto: CreateCategoryDto) {
    return super.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso',
  })
  override update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return super.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar categoria' })
  @ApiResponse({
    status: 204,
    description: 'Categoria deletada com sucesso',
  })
  override remove(@Param('id') id: string) {
    return super.remove(id);
  }
}
