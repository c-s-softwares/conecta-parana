import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Role } from '@prisma/client';

import { CategoryService } from './category.service';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { Roles } from '../../common/decorators/roles.decorator';

import { CreateCategoryDto } from './dto/request/create-category.dto';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';

@ApiTags('categories')
@Controller('categories')
export class CategoryController extends BaseCrudController<CreateCategoryDto,  >{
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
  })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }
}
