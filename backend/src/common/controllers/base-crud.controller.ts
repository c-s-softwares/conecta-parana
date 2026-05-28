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
import { AdminRoute } from '../decorators/admin-route.decorator';

/**
 * Controller Base Genérico que expõe as rotas REST padrões de CRUD (Create, Read, Update, Delete).
 * Toda rota mapeada delega a responsabilidade para a instância correspondente do BaseCrudService.
 *
 * @template TResponse Tipo DTO de resposta do objeto
 * @template TCreateDto Tipo DTO contendo os dados de criação
 * @template TUpdateDto Tipo DTO contendo os dados de atualização
 */
export abstract class BaseCrudController<TResponse, TCreateDto, TUpdateDto> {
  /**
   * Inicializa o controller genérico associando seu respectivo serviço de CRUD.
   *
   * @param service Instância do serviço genérico herdado de BaseCrudService
   */
  constructor(
    protected readonly service: BaseCrudService<
      TResponse,
      TCreateDto,
      TUpdateDto
    >,
  ) {}

  /**
   * Rota de listagem pública paginada e filtrável da entidade correspondente.
   *
   * @param query DTO contendo página, tamanho da página e termo de busca opcional
   */
  @Get()
  @ApiOperation({ summary: 'Listar com paginação' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Rota pública para busca de um único registro pelo identificador ULID.
   *
   * @param id ID único do registro (ULID)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Rota protegida para criação de um novo registro.
   * Apenas administradores do sistema têm acesso a este endpoint.
   *
   * @param dto DTO com os dados do novo registro
   */
  @Post()
  @AdminRoute()
  @ApiOperation({ summary: 'Criar novo registro' })
  @ApiResponse({ status: 201, description: 'Criado com sucesso' })
  create(@Body() dto: TCreateDto) {
    return this.service.create(dto);
  }

  /**
   * Rota protegida para atualização parcial ou total de um registro.
   * Apenas administradores do sistema têm acesso a este endpoint.
   *
   * @param id ID único do registro a ser atualizado (ULID)
   * @param dto DTO com os campos modificados do registro
   */
  @Patch(':id')
  @AdminRoute()
  @ApiOperation({ summary: 'Atualizar registro' })
  @ApiResponse({ status: 200, description: 'Atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  update(@Param('id') id: string, @Body() dto: TUpdateDto) {
    return this.service.update(id, dto);
  }

  /**
   * Rota protegida para remoção de um registro (soft-delete ou física dependendo da entidade).
   * Apenas administradores do sistema têm acesso a este endpoint.
   *
   * @param id ID único do registro a ser removido (ULID)
   */
  @Delete(':id')
  @AdminRoute()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover registro' })
  @ApiResponse({ status: 204, description: 'Removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
