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
import { apiError } from '../../common/errors/api-error';
import { EVENT_ERRORS } from './events.errors';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';
import { LOCALS_ERRORS } from '../locals/locals.errors';

import { JwtPayload } from '../auth/strategies/jwt.strategy';

import { CreateEventDto } from './dto/request/create-event.dto';
import { UpdateEventDto } from './dto/request/update-event.dto';
import { QueryEventsDto } from './dto/request/query-events.dto';

import { BaseCrudService } from '../../common/services/base-crud.service';
import { EventResponse } from './dto/response/event-response.dto';

type EventEntity = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  eventDate: Date;

  cityId: string;
  userId: string;
  localId: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class EventsService extends BaseCrudService<
  EventResponse,
  CreateEventDto,
  UpdateEventDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.EVENT,
      entityName: 'Evento',
      softDelete: true,
      notFoundErrorKey: EVENT_ERRORS.EVENT_NOT_FOUND,
    });
  }

  protected getDelegate() {
    return this.prisma.client.event;
  }

  protected toResponse(entity: unknown): EventResponse {
    const event = entity as EventEntity;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      status: event.status,
      eventDate: event.eventDate,
      cityId: event.cityId,
      userId: event.userId,
      localId: event.localId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  protected toCreateData(dto: CreateEventDto): Record<string, unknown> {
    // This is handled in the create override because it needs context.
    // Returning dummy to satisfy abstract signature.
    return { ...dto };
  }

  protected toUpdateData(dto: UpdateEventDto): Record<string, unknown> {
    // Handled in override
    return { ...dto };
  }

  protected buildSearchWhere(query: QueryEventsDto): Record<string, unknown> {
    const where: Record<string, unknown> = {
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

    return where;
  }

  async findAll(query: QueryEventsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    this.validateOptionalType(query.type);
    this.validateOptionalStatus(query.status);

    const where = {
      ...this.buildBaseWhere(),
      ...this.buildSearchWhere(query),
    };

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
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  // Override to include user context
  async create(dto: CreateEventDto, user?: JwtPayload): Promise<EventResponse> {
    if (!user) throw new ForbiddenException();

    this.validateType(dto.type);
    this.validateStatus(dto.status);
    this.validateEventDate(dto.eventDate);

    const cityId = this.resolveCityId(dto.cityId, user);

    if (dto.localId) {
      await this.validateLocalBelongsToCity(dto.localId, cityId);
    }

    const entity = await this.prisma.client.event.create({
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

    await this.afterSave(entity);
    return this.toResponse(entity);
  }

  // Override for user context and optimistic lock
  async update(
    id: string,
    dto: UpdateEventDto,
    user?: JwtPayload,
  ): Promise<EventResponse> {
    if (!user) throw new ForbiddenException();

    const current = (await this.prisma.client.event.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    })) as EventEntity | null;

    if (!current) {
      throw new NotFoundException(apiError(EVENT_ERRORS.EVENT_NOT_FOUND));
    }

    this.validateAdminCityScope(current.cityId, user);

    if (dto.type) this.validateType(dto.type);
    if (dto.status) this.validateStatus(dto.status);

    const cityId = dto.cityId ?? current.cityId;

    if (dto.localId) {
      await this.validateLocalBelongsToCity(dto.localId, cityId);
    }

    const updated: { count: number } =
      await this.prisma.client.event.updateMany({
        where: {
          id,
          deletedAt: null,
          updatedAt: dto.updatedAt
            ? new Date(dto.updatedAt)
            : current.updatedAt,
        },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.eventDate !== undefined && {
            eventDate: new Date(dto.eventDate),
          }),
          ...(dto.cityId !== undefined && { cityId: dto.cityId }),
          ...(dto.localId !== undefined && { localId: dto.localId }),
        },
      });

    if (updated.count === 0) {
      throw new ConflictException(apiError(EVENT_ERRORS.EVENT_CHANGED));
    }

    const newEntity = await this.findOne(id);
    await this.afterSave(newEntity);
    return newEntity;
  }

  async remove(id: string, user?: JwtPayload): Promise<void> {
    if (!user) throw new ForbiddenException();

    const event = (await this.prisma.client.event.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    })) as EventEntity | null;

    if (!event) {
      throw new NotFoundException(apiError(EVENT_ERRORS.EVENT_NOT_FOUND));
    }

    this.validateAdminCityScope(event.cityId, user);

    await this.checkBeforeDelete(id);

    await this.prisma.client.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.afterDelete(id);
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
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }
  }

  private async validateLocalBelongsToCity(
    localId: string,
    cityId: string,
  ): Promise<void> {
    if (localId === null) {
      throw new NotFoundException(apiError(LOCALS_ERRORS.LOCAL_NOT_FOUND));
    }

    const local = await this.prisma.client.local.findFirst({
      where: {
        id: localId,
      },
      select: {
        cityId: true,
      },
    });

    if (!local) {
      throw new NotFoundException(apiError(LOCALS_ERRORS.LOCAL_NOT_FOUND));
    }

    if (local.cityId !== cityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }
  }

  private validateEventDate(eventDate: string): void {
    if (new Date(eventDate).getTime() < Date.now()) {
      throw new BadRequestException(apiError(EVENT_ERRORS.EVENT_DATE_IN_PAST));
    }
  }

  private validateType(type: string): void {
    if (!VALID_EVENT_TYPES.includes(type)) {
      throw new BadRequestException(apiError(EVENT_ERRORS.INVALID_EVENT_TYPE));
    }
  }

  private validateStatus(status: string): void {
    if (!VALID_EVENT_STATUS.includes(status)) {
      throw new BadRequestException(apiError(EVENT_ERRORS.INVALID_STATUS));
    }
  }

  private validateOptionalType(type?: string): void {
    if (type) this.validateType(type);
  }

  private validateOptionalStatus(status?: string): void {
    if (status) this.validateStatus(status);
  }
}
