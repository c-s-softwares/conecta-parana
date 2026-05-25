import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { generateId } from '../utils/ulid.util';
import { TABLE_PREFIX } from '../types/ulid.types';
import { PaginationQueryDto } from '../dto/request/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/response/paginated-response.dto';
import { apiError, StaticCode } from '../errors/api-error';

type TablePrefix = (typeof TABLE_PREFIX)[keyof typeof TABLE_PREFIX];

/**
 * Contrato mínimo que todos os delegates gerados pelo Prisma Client para cada model implementam.
 * Como o Prisma gera tipos específicos para cada entidade, esta interface garante a tipagem necessária
 * para que o BaseCrudService genérico interaja com os métodos essenciais de banco de dados.
 */
interface PrismaDelegate {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
}

/**
 * Configuração de inicialização necessária para o comportamento do CRUD genérico.
 */
export interface BaseCrudConfig {
  /** Prefixo de tabela correspondente ao tipo de ULID (ex: TABLE_PREFIX.CITY) */
  tablePrefix: TablePrefix;
  /** Nome legível da entidade para mensagens de erro padrão (ex: 'Cidade') */
  entityName: string;
  /** Código de erro padrão para registro duplicado (Unique Constraint - P2002) */
  duplicateErrorKey?: StaticCode;
  /** Código de erro padrão para registro não encontrado (NotFound) */
  notFoundErrorKey?: StaticCode;
  /** Ativa comportamento de Soft-Delete (atualiza 'deletedAt' ao invés de remover fisicamente) */
  softDelete?: boolean;
}

/**
 * Serviço Base Genérico para operações de CRUD (Create, Read, Update, Delete).
 * Abstrai a lógica de persistência e validações comuns integradas ao Prisma ORM.
 *
 * @template TResponse Tipo DTO de resposta do objeto
 * @template TCreateDto Tipo DTO contendo os dados de criação
 * @template TUpdateDto Tipo DTO contendo os dados de atualização
 */
export abstract class BaseCrudService<TResponse, TCreateDto, TUpdateDto> {
  /**
   * Inicializa o serviço base.
   *
   * @param prisma Serviço de acesso ao banco de dados Prisma
   * @param config Objeto contendo as configurações de comportamento da entidade
   */
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly config: BaseCrudConfig,
  ) {}

  /**
   * Método abstrato obrigatório. Deve retornar o delegate do Prisma correspondente à entidade filha.
   * Exemplo: `return this.prisma.client.city;`
   */
  protected abstract getDelegate(): PrismaDelegate;

  /**
   * Converte a entidade de banco para o DTO de resposta tipado.
   */
  protected abstract toResponse(entity: unknown): TResponse;

  /**
   * Mapeia os campos do DTO de criação para o formato esperado pela tabela do banco.
   */
  protected abstract toCreateData(dto: TCreateDto): Record<string, unknown>;

  /**
   * Mapeia os campos do DTO de atualização para o formato esperado pela tabela do banco.
   */
  protected abstract toUpdateData(dto: TUpdateDto): Record<string, unknown>;

  // =========================================================================
  // Lifecycle Hooks & Extensibility Points (Podem ser sobrescritos nas classes filhas)
  // =========================================================================

  /**
   * Constrói a cláusula WHERE base.
   * Filtra registros deletados se a opção de soft-delete estiver ativada na entidade.
   */
  protected buildBaseWhere(): Record<string, unknown> {
    return this.config.softDelete ? { deletedAt: null } : {};
  }

  /**
   * Constrói filtros de pesquisa avançados baseados na query recebida por parâmetro.
   * Deve ser sobrescrito na classe filha para suportar busca textual ou filtros de propriedades.
   */
  protected buildSearchWhere(
    query: PaginationQueryDto,
  ): Record<string, unknown> {
    void query;
    return {};
  }

  /**
   * Gancho (hook) de validação antes de prosseguir com a exclusão de um registro.
   * Lança exceções (ex: ConflictException) se a exclusão violar alguma regra de negócio.
   */
  protected checkBeforeDelete(id: string): Promise<void> {
    void id;
    return Promise.resolve();
  }

  /**
   * Gancho (hook) pós-salvamento (chamado após a criação e atualização de registros).
   * Ideal para invalidação de cache, publicação de eventos ou logs de auditoria.
   */
  protected afterSave(entity: unknown): Promise<void> {
    void entity;
    return Promise.resolve();
  }

  /**
   * Gancho (hook) pós-exclusão (chamado após a exclusão de registros).
   * Ideal para invalidação de cache, publicação de eventos ou limpezas adicionais.
   */
  protected afterDelete(id: string): Promise<void> {
    void id;
    return Promise.resolve();
  }

  // =========================================================================
  // Core CRUD Operations
  // =========================================================================

  /**
   * Lista registros de forma paginada e ordenada de forma decrescente pela data de criação.
   *
   * @param query DTO contendo filtros de paginação e termos de pesquisa
   */
  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TResponse>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = {
      ...this.buildBaseWhere(),
      ...this.buildSearchWhere(query),
    };

    const [items, total] = await Promise.all([
      this.getDelegate().findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.getDelegate().count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Busca um único registro baseado no ID fornecido.
   * Lança NotFoundException se o registro não for localizado ou estiver marcado como deletado.
   *
   * @param id ID único do registro (ULID)
   */
  async findOne(id: string): Promise<TResponse> {
    const where = {
      id,
      ...this.buildBaseWhere(),
    };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(
        this.config.notFoundErrorKey
          ? apiError(this.config.notFoundErrorKey)
          : `${this.config.entityName} não encontrada`,
      );
    }

    return this.toResponse(entity);
  }

  /**
   * Cria um novo registro no banco de dados.
   * Gera automaticamente um identificador ULID baseado no prefixo configurado.
   *
   * @param dto DTO contendo dados para a criação do registro
   */
  async create(dto: TCreateDto): Promise<TResponse> {
    try {
      const entity = await this.getDelegate().create({
        data: {
          id: generateId(this.config.tablePrefix),
          ...this.toCreateData(dto),
        },
      });

      await this.afterSave(entity);
      return this.toResponse(entity);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          this.config.duplicateErrorKey
            ? apiError(this.config.duplicateErrorKey)
            : 'duplicate_record',
        );
      }
      throw error;
    }
  }

  /**
   * Atualiza um registro existente identificado pelo ID.
   * Lança NotFoundException se o registro não existir ou estiver marcado como deletado.
   *
   * @param id ID único do registro (ULID)
   * @param dto DTO contendo os campos atualizados do registro
   */
  async update(id: string, dto: TUpdateDto): Promise<TResponse> {
    const where = {
      id,
      ...this.buildBaseWhere(),
    };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(
        this.config.notFoundErrorKey
          ? apiError(this.config.notFoundErrorKey)
          : `${this.config.entityName} não encontrada`,
      );
    }

    try {
      const updated = await this.getDelegate().update({
        where: { id },
        data: this.toUpdateData(dto),
      });

      await this.afterSave(updated);
      return this.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          this.config.duplicateErrorKey
            ? apiError(this.config.duplicateErrorKey)
            : 'duplicate_record',
        );
      }
      throw error;
    }
  }

  /**
   * Remove um registro.
   * Se soft-delete estiver ativado, define a propriedade 'deletedAt' com a data e hora atual.
   * Caso contrário, remove o registro fisicamente do banco de dados.
   * Lança NotFoundException se o registro não existir ou já estiver deletado.
   *
   * @param id ID único do registro (ULID)
   */
  async remove(id: string): Promise<void> {
    const where = {
      id,
      ...this.buildBaseWhere(),
    };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(
        this.config.notFoundErrorKey
          ? apiError(this.config.notFoundErrorKey)
          : `${this.config.entityName} não encontrada`,
      );
    }

    await this.checkBeforeDelete(id);

    if (this.config.softDelete) {
      await this.getDelegate().update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } else {
      await this.getDelegate().delete({ where: { id } });
    }

    await this.afterDelete(id);
  }
}
