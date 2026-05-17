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
      duplicateErrorKey: 'city_duplicate',
      notFoundErrorKey: 'city_not_found',
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
        throw new ConflictException('city_has_content');
      }
    }
  }

  protected async afterSave(entity: unknown): Promise<void> {
    await this.cacheManager.del('/cities');
  }

  protected async afterDelete(id: string): Promise<void> {
    await this.cacheManager.del('/cities');
  }
}
