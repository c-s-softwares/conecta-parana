import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { generateId } from '../utils/ulid.util';
import { TABLE_PREFIX } from '../types/ulid.types';
import { PaginationQueryDto } from '../dto/request/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/response/paginated-response.dto';

type TablePrefix = (typeof TABLE_PREFIX)[keyof typeof TABLE_PREFIX];

interface PrismaDelegate {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
}

export interface BaseCrudConfig {
  tablePrefix: TablePrefix;
  entityName: string;
  duplicateErrorKey?: string;
  notFoundErrorKey?: string;
  softDelete?: boolean;
}

export abstract class BaseCrudService<TResponse, TCreateDto, TUpdateDto> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly config: BaseCrudConfig,
  ) {}

  protected abstract getDelegate(): PrismaDelegate;
  protected abstract toResponse(entity: unknown): TResponse;
  protected abstract toCreateData(dto: TCreateDto): Record<string, unknown>;
  protected abstract toUpdateData(dto: TUpdateDto): Record<string, unknown>;

  // Hooks for customization in subclasses
  protected buildBaseWhere(): Record<string, unknown> {
    return this.config.softDelete ? { deletedAt: null } : {};
  }

  protected buildSearchWhere(
    query: PaginationQueryDto,
  ): Record<string, unknown> {
    return {};
  }

  protected async checkBeforeDelete(id: string): Promise<void> {}
  protected async afterSave(entity: unknown): Promise<void> {}
  protected async afterDelete(id: string): Promise<void> {}

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

  async findOne(id: string): Promise<TResponse> {
    const where = {
      id,
      ...this.buildBaseWhere(),
    };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(
        this.config.notFoundErrorKey ||
          `${this.config.entityName} não encontrada`,
      );
    }

    return this.toResponse(entity);
  }

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
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          this.config.duplicateErrorKey || 'duplicate_record',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: TUpdateDto): Promise<TResponse> {
    const where = {
      id,
      ...this.buildBaseWhere(),
    };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(
        this.config.notFoundErrorKey ||
          `${this.config.entityName} não encontrada`,
      );
    }

    try {
      const updated = await this.getDelegate().update({
        where: { id },
        data: this.toUpdateData(dto),
      });

      await this.afterSave(updated);
      return this.toResponse(updated);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          this.config.duplicateErrorKey || 'duplicate_record',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const where = {
      id,
      ...this.buildBaseWhere(),
    };
    const entity = await this.getDelegate().findFirst({ where });

    if (!entity) {
      throw new NotFoundException(
        this.config.notFoundErrorKey ||
          `${this.config.entityName} não encontrada`,
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
