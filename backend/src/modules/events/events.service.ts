import {
  VALID_EVENT_STATUS,
  VALID_EVENT_TYPES,
} from './constants/events.constants';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { generateId } from '../../common/utils/ulid.util';
import { apiError, API_ERROR_CODE } from '../../common/errors/api-error';

import { JwtPayload } from '../auth/strategies/jwt.strategy';

import { CreateEventDto } from './dto/request/create-event.dto';
import { UpdateEventDto } from './dto/request/update-event.dto';
import { QueryEventsDto } from './dto/request/query-events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryEventsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    this.validateOptionalType(query.type);
    this.validateOptionalStatus(query.status);

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(query.cityId && { cityId: query.cityId }),
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };

    if (query.from || query.to) {
      where.eventDate = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    if (query.categoryId) {
      where.local = {
        categoryId: query.categoryId,
      };
    }

    const orderBy =
      query.order === 'date_desc'
        ? { eventDate: 'desc' as const }
        : { eventDate: 'asc' as const };

    const [items, total] = await Promise.all([
      this.prisma.client.event.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.client.event.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.client.event.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundException(apiError(API_ERROR_CODE.EVENT_NOT_FOUND));
    }

    return event;
  }

  async create(dto: CreateEventDto, user: JwtPayload) {
    this.validateType(dto.type);
    this.validateStatus(dto.status);
    this.validateEventDate(dto.eventDate);

    const cityId = this.resolveCityId(dto.cityId, user);

    if (dto.localId) {
      await this.validateLocalBelongsToCity(dto.localId, cityId);
    }

    return this.prisma.client.event.create({
      data: {
        id: generateId(TABLE_PREFIX.EVENT),
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status,
        eventDate: new Date(dto.eventDate),
        cityId,
        userId: user.sub,
        localId: dto.localId,
      },
    });
  }

  async update(id: string, dto: UpdateEventDto, user: JwtPayload) {
    const current = await this.prisma.client.event.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException(apiError(API_ERROR_CODE.EVENT_NOT_FOUND));
    }

    this.validateAdminCityScope(current.cityId, user);

    if (dto.type) this.validateType(dto.type);
    if (dto.status) this.validateStatus(dto.status);

    const cityId = dto.cityId ?? current.cityId;

    if (dto.localId) {
      await this.validateLocalBelongsToCity(dto.localId, cityId);
    }

    try {
      const updated = await this.prisma.client.event.updateMany({
        where: {
          id,
          deletedAt: null,
          updatedAt: dto.updatedAt
            ? new Date(dto.updatedAt)
            : current.updatedAt,
        },
        data: {
          ...(dto.title && { title: dto.title }),
          ...(dto.description && { description: dto.description }),
          ...(dto.type && { type: dto.type }),
          ...(dto.status && { status: dto.status }),
          ...(dto.eventDate && { eventDate: new Date(dto.eventDate) }),
          ...(dto.cityId && { cityId: dto.cityId }),
          ...(dto.localId !== undefined && { localId: dto.localId }),
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(apiError(API_ERROR_CODE.EVENT_CHANGED));
      }

      return this.findOne(id);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new ConflictException(apiError(API_ERROR_CODE.EVENT_CHANGED));
    }
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const event = await this.prisma.client.event.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundException(apiError(API_ERROR_CODE.EVENT_NOT_FOUND));
    }

    this.validateAdminCityScope(event.cityId, user);

    await this.prisma.client.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private resolveCityId(cityId: string | undefined, user: JwtPayload): string {
    if (user.role !== Role.ADMIN) {
      return cityId as string;
    }

    if (user.cityId) {
      return user.cityId;
    }

    return cityId as string;
  }

  private validateAdminCityScope(cityId: string, user: JwtPayload): void {
    if (user.role === Role.ADMIN && user.cityId && user.cityId !== cityId) {
      throw new ForbiddenException(apiError(API_ERROR_CODE.CITY_SCOPE_DENIED));
    }
  }

  private async validateLocalBelongsToCity(
    localId: string,
    cityId: string,
  ): Promise<void> {
    const local = await this.prisma.client.local.findFirst({
      where: {
        id: localId,
      },
      select: {
        cityId: true,
      },
    });

    if (local && local.cityId !== cityId) {
      throw new BadRequestException(
        apiError(API_ERROR_CODE.COORDINATES_LOCAL_MISMATCH),
      );
    }
  }

  private validateEventDate(eventDate: string): void {
    if (new Date(eventDate).getTime() < Date.now()) {
      throw new BadRequestException(
        apiError(API_ERROR_CODE.EVENT_DATE_IN_PAST),
      );
    }
  }

  private validateType(type: string): void {
    if (!VALID_EVENT_TYPES.includes(type)) {
      throw new BadRequestException(apiError(API_ERROR_CODE.INVALID_TYPE));
    }
  }

  private validateStatus(status: string): void {
    if (!VALID_EVENT_STATUS.includes(status)) {
      throw new BadRequestException(apiError(API_ERROR_CODE.INVALID_STATUS));
    }
  }

  private validateOptionalType(type?: string): void {
    if (type) this.validateType(type);
  }

  private validateOptionalStatus(status?: string): void {
    if (status) this.validateStatus(status);
  }
}
