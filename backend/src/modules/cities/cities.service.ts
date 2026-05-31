import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateCityDto } from './dto/request/create-city.dto';
import { UpdateCityDto } from './dto/request/update-city.dto';
import { CityResponse } from './dto/response/city-response.dto';
import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';
import { apiError } from '../../common/errors/api-error';
import { CITIES_ERRORS } from './cities.errors';

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
    };
    return {
      id: city.id,
      name: city.name,
      state: city.state,
    };
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
      console.error('Erro ao limpar cache de cidades:', err);
    }
  }
}
