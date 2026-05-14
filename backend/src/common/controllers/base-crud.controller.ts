import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudService } from '../services/base-crud.service';
import { PaginationQueryDto } from '../dto/request/pagination-query.dto';

/**
 * controler generico.
 *
 * @template TResponse objeto de resposta
 * @template TCreateDto  DTO de criação
 * @template TUpdateDto DTO de atualização
 */
export abstract class BaseCrudController<TResponse, TCreateDto, TUpdateDto> {
  constructor(
    protected readonly service: BaseCrudService<
      TResponse,
      TCreateDto,
      TUpdateDto
    >,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar com paginação' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo registro' })
  @ApiResponse({ status: 201, description: 'Criado com sucesso' })
  create(@Body() dto: TCreateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar registro' })
  @ApiResponse({ status: 200, description: 'Atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  update(@Param('id') id: string, @Body() dto: TUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover registro' })
  @ApiResponse({ status: 204, description: 'Removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
