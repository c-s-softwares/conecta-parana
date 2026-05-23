import {
  BadRequestException,
  NotFoundException,
  Injectable,
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

import { PaginatedResponseDto } from '../../common/dto/response/paginated-response.dto';

import { VALID_CATEGORY_ICONS } from './constants/category-icons';

@Injectable()
export class CategoryService extends BaseCrudService<
  CategoryResponse,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor(
    prisma: PrismaService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.CATEGORY,
      entityName: 'Categoria',
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
      throw new BadRequestException({
        code: 'invalid_icon',
        message: 'Ícone inválido',
      });
    }

    return {
      name: dto.name,
      icon: dto.icon,
    };
  }

  protected toUpdateData(dto: UpdateCategoryDto): Record<string, unknown> {
    if (dto.icon && !VALID_CATEGORY_ICONS.includes(dto.icon)) {
      throw new BadRequestException({
        code: 'invalid_icon',
        message: 'Ícone inválido',
      });
    }

    return {
      ...(dto.name && { name: dto.name }),
      ...(dto.icon && { icon: dto.icon }),
    };
  }

  override async remove(id: string): Promise<void> {
    const category = await this.getDelegate().findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    await this.getDelegate().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  override async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CategoryResponse>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const cacheKey = `categories:page:${page}:size:${pageSize}`;

    const cached =
      await this.cacheManager.get<PaginatedResponseDto<CategoryResponse>>(
        cacheKey,
      );

    if (cached) {
      return cached;
    }

    const where = {
      deletedAt: null,
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

    const response = {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };

    await this.cacheManager.set(cacheKey, response, 3_600_000);

    return response;
  }

  override async findOne(id: string): Promise<CategoryResponse> {
    const cacheKey = `category:${id}`;

    const cached = await this.cacheManager.get<CategoryResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const entity = await this.getDelegate().findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const response = this.toResponse(entity);

    await this.cacheManager.set(cacheKey, response, 3_600_000);

    return response;
  }
}
