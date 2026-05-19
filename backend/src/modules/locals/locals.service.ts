import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateLocalDto } from './dto/request/create-local.dto';
import { UpdateLocalDto } from './dto/request/update-local.dto';
import {
  LocalResponseDto,
  LocalNearbyResponseDto,
} from './dto/response/local-response.dto';
import { NearbyQueryDto } from './dto/request/nearby-query.dto';
import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/response/paginated-response.dto';

@Injectable()
export class LocalsService extends BaseCrudService<
  LocalResponseDto,
  CreateLocalDto,
  UpdateLocalDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.LOCAL,
      entityName: 'Local',
      notFoundErrorKey: 'local_not_found',
      softDelete: true,
    });
  }

  protected getDelegate() {
    return this.prisma.client.local;
  }

  protected toResponse(entity: unknown): LocalResponseDto {
    const e = entity as {
      id: string;
      name: string;
      description: string | null;
      address: string;
      phone: string | null;
      cityId: string;
      categoryId: string;
      userId: string;
    };
    return {
      id: e.id,
      name: e.name,
      description: e.description ?? '',
      address: e.address,
      phone: e.phone ?? '',
      cityId: e.cityId,
      categoryId: e.categoryId,
      userId: e.userId,
    };
  }

  protected toCreateData(
    dto: CreateLocalDto & { userId: string },
  ): Record<string, unknown> {
    return {
      name: dto.name,
      description: dto.description,
      address: dto.address,
      phone: dto.phone,
      cityId: dto.cityId,
      categoryId: dto.categoryId,
      userId: dto.userId,
    };
  }

  protected toUpdateData(dto: UpdateLocalDto): Record<string, unknown> {
    return {
      ...(dto.name && { name: dto.name }),
      ...(dto.description && { description: dto.description }),
      ...(dto.address && { address: dto.address }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.categoryId && { categoryId: dto.categoryId }),
    };
  }

  protected buildSearchWhere(
    query: PaginationQueryDto,
  ): Record<string, unknown> {
    if (!query.search) return {};
    return {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    };
  }

  override async findOne(id: string): Promise<LocalResponseDto> {
    const response = await super.findOne(id);
    const coords = await this.prisma.client.$queryRaw<
      { lng: number | null; lat: number | null }[]
    >`
      SELECT ST_X(coordinates) as lng, ST_Y(coordinates) as lat
      FROM locals
      WHERE id = ${id}
    `;
    if (
      coords &&
      coords.length > 0 &&
      coords[0].lat !== null &&
      coords[0].lng !== null
    ) {
      response.coordinates = {
        lat: coords[0].lat,
        lng: coords[0].lng,
      };
    } else {
      response.coordinates = null;
    }
    return response;
  }

  override async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<LocalResponseDto>> {
    const result = await super.findAll(query);
    const ids = result.items.map((item) => item.id);
    if (ids.length > 0) {
      const coords = await this.prisma.client.$queryRaw<
        { id: string; lng: number | null; lat: number | null }[]
      >`
        SELECT id, ST_X(coordinates) as lng, ST_Y(coordinates) as lat
        FROM locals
        WHERE id = ANY(${ids})
      `;
      const coordsMap = new Map<string, { lat: number; lng: number }>();
      for (const row of coords) {
        if (row.lat !== null && row.lng !== null) {
          coordsMap.set(row.id, { lat: row.lat, lng: row.lng });
        }
      }
      for (const item of result.items) {
        item.coordinates = coordsMap.get(item.id) ?? null;
      }
    }
    return result;
  }

  override async create(
    dto: CreateLocalDto & { userId: string },
  ): Promise<LocalResponseDto> {
    const response = await super.create(dto);
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await this.prisma.client.$executeRaw`
        UPDATE locals
        SET coordinates = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)
        WHERE id = ${response.id}
      `;
      response.coordinates = { lat: dto.latitude, lng: dto.longitude };
    } else {
      response.coordinates = null;
    }
    return response;
  }

  override async update(
    id: string,
    dto: UpdateLocalDto,
  ): Promise<LocalResponseDto> {
    const response = await super.update(id, dto);
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await this.prisma.client.$executeRaw`
        UPDATE locals
        SET coordinates = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)
        WHERE id = ${id}
      `;
      response.coordinates = { lat: dto.latitude, lng: dto.longitude };
    } else if (dto.latitude === null || dto.longitude === null) {
      await this.prisma.client.$executeRaw`
        UPDATE locals
        SET coordinates = NULL
        WHERE id = ${id}
      `;
      response.coordinates = null;
    } else {
      const coords = await this.prisma.client.$queryRaw<
        { lng: number | null; lat: number | null }[]
      >`
        SELECT ST_X(coordinates) as lng, ST_Y(coordinates) as lat
        FROM locals
        WHERE id = ${id}
      `;
      if (
        coords &&
        coords.length > 0 &&
        coords[0].lat !== null &&
        coords[0].lng !== null
      ) {
        response.coordinates = {
          lat: coords[0].lat,
          lng: coords[0].lng,
        };
      } else {
        response.coordinates = null;
      }
    }
    return response;
  }

  async findNearby(
    query: NearbyQueryDto,
  ): Promise<{ items: LocalNearbyResponseDto[]; total: number }> {
    const { lat, lng, radius, categoryId } = query;

    const categoryCondition = categoryId
      ? Prisma.sql`AND category_id = ${categoryId}`
      : Prisma.empty;

    interface LocalNearbyRow {
      id: string;
      name: string;
      description: string | null;
      address: string;
      phone: string | null;
      cityId: string;
      categoryId: string;
      userId: string;
      lat: number | null;
      lng: number | null;
      distance: number;
    }

    const items = await this.prisma.client.$queryRaw<LocalNearbyRow[]>`
      SELECT 
        id, 
        name, 
        description, 
        address, 
        phone, 
        city_id as "cityId", 
        category_id as "categoryId", 
        created_by_user_id as "userId",
        ST_X(coordinates) as lng,
        ST_Y(coordinates) as lat,
        ROUND(ST_Distance(
          coordinates::geography, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )::numeric)::integer as distance
      FROM locals
      WHERE ST_DWithin(
        coordinates::geography, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 
        ${radius}
      )
      AND deleted_at IS NULL
      ${categoryCondition}
      ORDER BY distance ASC
    `;

    const mappedItems: LocalNearbyResponseDto[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      address: item.address,
      phone: item.phone ?? '',
      cityId: item.cityId,
      categoryId: item.categoryId,
      userId: item.userId,
      distance: item.distance,
      coordinates:
        item.lat !== null && item.lng !== null
          ? { lat: item.lat, lng: item.lng }
          : null,
    }));

    return {
      items: mappedItems,
      total: mappedItems.length,
    };
  }
}
