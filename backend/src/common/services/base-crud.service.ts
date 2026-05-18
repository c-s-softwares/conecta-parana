import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { generateId } from '../utils/ulid.util';
import { TABLE_PREFIX } from '../types/ulid.types';
import { PaginationQueryDto } from '../dto/request/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/response/paginated-response.dto';

type TablePrefix = (typeof TABLE_PREFIX)[keyof typeof TABLE_PREFIX];

/**
 * interface(contrato mínimo que todo delegate do prisma implementa.(o primsa gera tipos unicos para cada entidade)
 * cada model prisma gera tipos unicos, como o basecrud é generico, precisamos garantir que cada model tenha esses 6(7) metodos
 */
interface PrismaDelegate {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
}

export interface BaseCrudConfig {
  /* prefixo da tabela */
  tablePrefix: TablePrefix;
  /*nnome da entidade*/
  entityName: string;
}

export abstract class BaseCrudService<TResponse, TCreateDto, TUpdateDto> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly config: BaseCrudConfig,
  ) {} //classe abstrata, pede essas 2 configs, sendo o prisma daquela entidade e da propripa entidade, basecrud nao consegue ter acesso direto ao prisma, pois ele é generico
  //metodos abstratos, para cada entidade filha definir como funciona
  // retorna a entidade (ex: this.prisma.client.city)
  protected abstract getDelegate(): PrismaDelegate;

  // mapeia a entidade do banco para o shape de resposta da API
  protected abstract toResponse(entity: unknown): TResponse; //necesidade?

  //mapeia o DTO de criação
  protected abstract toCreateData(dto: TCreateDto): Record<string, unknown>;

  // mapeia o DTO de update para o shape de data do Prisma
  protected abstract toUpdateData(dto: TUpdateDto): Record<string, unknown>;

  //lista com paginacao
  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TResponse>> {
    const page = query.page ?? 1; //checar dps se tem padrao para ambos
    const pageSize = query.pageSize ?? 10;
    const where = {}; //pode ser sem where, mas define na classe em si antes de montar o sql

    const [items, total] = await Promise.all([
      this.getDelegate().findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }, //mais novos por padrao, a checar tbm com basecrud
      }),
      this.getDelegate().count({ where }),
    ]);
    //retorna objeto com itens mapeados, total, pagina atual e tamanho da pagina
    return {
      items: items.map((item) => this.toResponse(item)), //transforma o obj bruto do prisma em algo mapeado para resposta(CASO QUIRA ALGO VER ALGO PARA MELHOR VISUALIZACAO, CHECE ALGUM SERVIC QUE IMPLEMENTOU ESSA CLASSE)
      total,
      page,
      pageSize,
    };
  }

  //busca por id
  async findOne(id: string): Promise<TResponse> {
    const where = { id };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(`${this.config.entityName} não encontrada`);
    }

    return this.toResponse(entity);
  }

  //cria nova entidade, adiciona id na entradas
  async create(dto: TCreateDto): Promise<TResponse> {
    const entity = await this.getDelegate().create({
      data: {
        id: generateId(this.config.tablePrefix),
        ...this.toCreateData(dto), //implementado dentro de quem implementar essa classe, monta o obj para guardar no banco
      },
    });

    return this.toResponse(entity);
  }

  //atualiza entidade existente
  async update(id: string, dto: TUpdateDto): Promise<TResponse> {
    const where = { id };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(`${this.config.entityName} não encontrada`);
    }

    const updated = await this.getDelegate().update({
      where: { id },
      data: this.toUpdateData(dto),
    });

    return this.toResponse(updated);
  }

  //remove entidade
  async remove(id: string): Promise<void> {
    const where = { id };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(`${this.config.entityName} não encontrada`);
    }

    await this.getDelegate().delete({
      where: { id },
    });
  }
}
