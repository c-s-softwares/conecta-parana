import {
  BadRequestException,
  Injectable,
  ConflictException,
  Inject,
} from '@nestjs/common';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { PrismaService } from '../../config/prisma.service';

import { TABLE_PREFIX } from '../../common/types/ulid.types';

import { BaseCrudService } from '../../common/services/base-crud.service';

import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';

import { CategoryResponse } from './dto/response/response-category.dto';

import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';

import { VALID_CATEGORY_ICONS } from './constants/category-icons';

import { apiError, API_ERROR_CODE } from '../../common/errors/api-error';

interface RedisCacheClient {
  keys(pattern: string): Promise<string[]>;
  del(keys: string[]): Promise<number>;
}

interface RedisCacheStore {
  _store?: {
    client?: RedisCacheClient;
    _client?: RedisCacheClient;
  };
}

@Injectable()
export class CategoryService extends BaseCrudService<
  CategoryResponse,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor(
    prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.CATEGORY,
      entityName: 'Categoria',
      softDelete: true,
      duplicateErrorKey: 'category_duplicate',
      notFoundErrorKey: 'category_not_found',
    });
  }

  protected getDelegate() {
    return this.prisma.client.category;
  }

  protected toResponse(entity: unknown): CategoryResponse {
    const category = entity as {
      id: string;
      name: string;
      icon: string;
    };

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
    };
  }

  protected toCreateData(dto: CreateCategoryDto): Record<string, unknown> {
    if (!VALID_CATEGORY_ICONS.includes(dto.icon)) {
      throw new BadRequestException(apiError(API_ERROR_CODE.INVALID_ICON));
    }

    return {
      name: dto.name,
      icon: dto.icon,
    };
  }

  protected toUpdateData(dto: UpdateCategoryDto): Record<string, unknown> {
    if (dto.icon !== undefined && !VALID_CATEGORY_ICONS.includes(dto.icon)) {
      throw new BadRequestException(apiError(API_ERROR_CODE.INVALID_ICON));
    }

    return {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
    };
  }

  protected buildSearchWhere(
    query: PaginationQueryDto,
  ): Record<string, unknown> {
    if (!query.search) return {};

    return {
      name: {
        contains: query.search,
        mode: 'insensitive',
      },
    };
  }

  protected async checkBeforeDelete(id: string): Promise<void> {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            locals: true,
          },
        },
      },
    });

    if (category && category._count.locals > 0) {
      throw new ConflictException(apiError(API_ERROR_CODE.CATEGORY_HAS_LOCALS));
    }
  }

  protected async afterSave(entity: unknown): Promise<void> {
    void entity;
    await this.clearCache();
  }

  protected async afterDelete(id: string): Promise<void> {
    void id;
    await this.clearCache();
  }

  private async clearCache(): Promise<void> {
    try {
      const store = (this.cacheManager as unknown as { store: RedisCacheStore })
        .store;
      const client = store?._store?.client || store?._store?._client;

      if (client) {
        const keys = await client.keys('keyv:/categories*');

        if (keys && keys.length > 0) {
          await client.del(keys);
        }
      } else {
        await this.cacheManager.del('/categories');
      }
    } catch (err) {
      console.error('Erro ao limpar cache de categorias:', err);
    }
  }
}
