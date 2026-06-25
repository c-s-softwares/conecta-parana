import {
  Injectable,
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Role } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginatedResponseDto } from '../../common/dto/response/paginated-response.dto';
import { CreateCityDto } from './dto/request/create-city.dto';
import { UpdateCityDto } from './dto/request/update-city.dto';
import { CityResponse } from './dto/response/city-response.dto';
import { CityStatsResponse } from './dto/response/city-stats-response.dto';
import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';
import { apiError } from '../../common/errors/api-error';
import { CITIES_ERRORS } from './cities.errors';

const ACTIVE_ADMIN_COUNT_INCLUDE = {
  _count: {
    select: {
      users: {
        where: {
          role: Role.ADMIN,
          emailVerifiedAt: { not: null },
        },
      },
    },
  },
} as const;

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
export class CitiesService extends BaseCrudService<
  CityResponse,
  CreateCityDto,
  UpdateCityDto
> {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.CITY,
      entityName: 'Cidade',
      duplicateErrorKey: CITIES_ERRORS.CITY_DUPLICATE,
      notFoundErrorKey: CITIES_ERRORS.CITY_NOT_FOUND,
      softDelete: true,
    });
  }

  protected getDelegate() {
    return this.prisma.client.city;
  }

  protected toResponse(entity: unknown): CityResponse {
    const city = entity as {
      id: string;
      name: string;
      state: string;
      _count?: { users: number };
    };
    return {
      id: city.id,
      name: city.name,
      state: city.state,
      adminCount: city._count?.users ?? 0,
    };
  }

  override async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CityResponse>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = {
      ...this.buildBaseWhere(),
      ...this.buildSearchWhere(query),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.city.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: ACTIVE_ADMIN_COUNT_INCLUDE,
      }),
      this.prisma.client.city.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async getStats(): Promise<CityStatsResponse> {
    const baseWhere = this.buildBaseWhere();

    const [total, withActiveAdmin] = await Promise.all([
      this.prisma.client.city.count({ where: baseWhere }),
      this.prisma.client.city.count({
        where: {
          ...baseWhere,
          users: {
            some: {
              role: Role.ADMIN,
              emailVerifiedAt: { not: null },
            },
          },
        },
      }),
    ]);

    return {
      total,
      withActiveAdmin,
      awaitingAdmin: total - withActiveAdmin,
    };
  }

  override async findOne(id: string): Promise<CityResponse> {
    const entity = await this.prisma.client.city.findFirst({
      where: { id, ...this.buildBaseWhere() },
      include: ACTIVE_ADMIN_COUNT_INCLUDE,
    });

    if (!entity) {
      throw new NotFoundException(apiError(CITIES_ERRORS.CITY_NOT_FOUND));
    }

    return this.toResponse(entity);
  }

  protected toCreateData(dto: CreateCityDto): Record<string, unknown> {
    return {
      name: dto.name,
      state: dto.state,
    };
  }

  protected toUpdateData(dto: UpdateCityDto): Record<string, unknown> {
    return {
      ...(dto.name && { name: dto.name }),
      ...(dto.state && { state: dto.state }),
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
    const cityWithRelations = await this.prisma.client.city.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            events: true,
            locals: true,
            news: true,
          },
        },
      },
    });

    if (cityWithRelations) {
      const { users, events, locals, news } = cityWithRelations._count;
      if (users > 0 || events > 0 || locals > 0 || news > 0) {
        throw new ConflictException(apiError(CITIES_ERRORS.CITY_HAS_CONTENT));
      }
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

  /**
   * Invalida todas as chaves de cache do módulo de cidades de forma robusta.
   * Busca por chaves com padrão 'keyv:/cities*' (incluindo variações de query params
   * como paginação, busca e filtros) e as remove do Redis.
   */
  private async clearCache(): Promise<void> {
    try {
      const store = (this.cacheManager as unknown as { store: RedisCacheStore })
        .store;
      const client = store?._store?.client || store?._store?._client;

      if (client) {
        // Encontra todas as chaves com o padrão '/cities*' no Redis (com o prefixo do Keyv)
        const keys = await client.keys('keyv:/cities*');
        if (keys && keys.length > 0) {
          await client.del(keys);
        }
      } else {
        // Fallback para ambientes de teste com mocks ou outros adaptadores de cache
        await this.cacheManager.del('/cities');
      }
    } catch (err) {
      // Impede que falhas de infraestrutura de cache interrompam o fluxo principal do CRUD
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Erro ao limpar cache de cidades: ${message}`);
    }
  }
}
