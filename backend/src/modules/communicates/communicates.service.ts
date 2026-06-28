import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { generateId } from '../../common/utils/ulid.util';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';
import { COMUNICADOS_ERRORS } from './communicates.errors';
import { CreateCommunicateDto } from './dto/request/create-communicate.dto';
import { UpdateCommunicateDto } from './dto/request/update-communicate.dto';
import { QueryComunicadoDto } from './dto/request/query-communicate.dto';
import {
  CommunicateDetailResponse,
  CommunicateResponse,
} from './dto/response/communicate-response.dto';
import { Role } from '@prisma/client';
import { ENTITY_TYPES } from '../uploads/constants/entity-type';

type AuthUser = {
  id: string;
  cityId?: string | null;
  role: Role;
};

@Injectable()
export class CommunicateService extends BaseCrudService<
  CommunicateResponse,
  CreateCommunicateDto,
  UpdateCommunicateDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.COMMUNICATE,
      entityName: 'Comunicado',
      duplicateErrorKey: COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND,
      notFoundErrorKey: COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND,
      softDelete: false,
    });
  }

  protected getDelegate() {
    return this.prisma.client.communicate;
  }

  protected toResponse(entity: unknown): CommunicateResponse {
    const communicate = entity as {
      id: string;
      title: string;
      description: string;
      isActive: boolean;
      cityId: string;
      userId: string;
      photos?: { id: string; thumbUrl: string | null }[];
    };

    return {
      id: communicate.id,
      title: communicate.title,
      description: communicate.description,
      isActive: communicate.isActive,
      cityId: communicate.cityId,
      userId: communicate.userId,
      photos: (communicate.photos ?? []).map((photo) => ({
        id: photo.id,
        thumbUrl: photo.thumbUrl,
      })),
    };
  }

  protected toCreateData(dto: CreateCommunicateDto): Record<string, unknown> {
    return {
      title: dto.title,
      description: dto.description,
      isActive: dto.isActive ?? true,
      cityId: dto.cityId,
    };
  }

  protected toUpdateData(dto: UpdateCommunicateDto): Record<string, unknown> {
    return {
      ...(dto.title && { title: dto.title }),
      ...(dto.description && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
  }

  protected buildSearchWhere(
    query: QueryComunicadoDto,
  ): Record<string, unknown> {
    return {
      ...(query.cityId && { cityId: query.cityId }),
      ...(query.isActive !== undefined && {
        isActive: query.isActive === 'true',
      }),
      ...(query.search && {
        title: {
          contains: query.search,
          mode: 'insensitive',
        },
      }),
    };
  }

  async createWithUser(
    dto: CreateCommunicateDto,
    user?: AuthUser,
  ): Promise<CommunicateResponse> {
    const currentUser = this.requireUser(user);
    const cityId = this.resolveCityId(dto.cityId, currentUser);

    const communicate = await this.prisma.client.communicate.create({
      data: {
        id: generateId(TABLE_PREFIX.COMMUNICATE),
        title: dto.title,
        description: dto.description,
        isActive: dto.isActive ?? true,
        cityId,
        userId: currentUser.id,
      },
    });

    return this.toResponse(communicate);
  }

  async updateWithUser(
    id: string,
    dto: UpdateCommunicateDto,
    user?: AuthUser,
  ): Promise<CommunicateResponse> {
    const currentUser = this.requireUser(user);
    const communicate = await this.findCommunicateOrFail(id);

    this.validateCityScope(communicate.cityId, currentUser);

    const updated = await this.prisma.client.communicate.update({
      where: { id },
      data: this.toUpdateData(dto),
    });

    return this.toResponse(updated);
  }

  async removeWithUser(id: string, user?: AuthUser): Promise<void> {
    const currentUser = this.requireUser(user);
    const communicate = await this.findCommunicateOrFail(id);

    this.validateCityScope(communicate.cityId, currentUser);

    await this.prisma.client.communicate.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  override async findAll(query: QueryComunicadoDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = { ...this.buildBaseWhere(), ...this.buildSearchWhere(query) };

    const [items, total] = await Promise.all([
      this.prisma.client.communicate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { photos: { select: { id: true, thumbUrl: true } } },
      }),
      this.getDelegate().count({ where }),
    ]);

    return {
      items: items.map((i) => this.toResponse(i)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Detalhe do comunicado para GET /communicates/:id. Inclui photos, authorName,
   * likesCount e flags de engajamento por usuário logado. Quando userId não é
   * informado (anônimo), liked/saved são false. Quando informado, dispara 2
   * queries adicionais (like + save) em paralelo.
   */
  async findOneDetail(
    id: string,
    userId?: string,
  ): Promise<CommunicateDetailResponse> {
    const communicate = await this.prisma.client.communicate.findFirst({
      where: { id, isActive: true },
      include: {
        photos: true,
        user: { select: { name: true } },
        _count: { select: { likes: true } },
      },
    });

    if (!communicate) {
      throw new NotFoundException(
        apiError(COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND),
      );
    }

    let liked = false;
    let saved = false;
    if (userId) {
      const [likeExists, saveExists] = await Promise.all([
        this.prisma.client.like.findFirst({
          where: { userId, communicateId: id },
          select: { id: true },
        }),
        this.prisma.client.save.findFirst({
          where: { userId, communicateId: id },
          select: { id: true },
        }),
      ]);
      liked = !!likeExists;
      saved = !!saveExists;
    }

    return {
      id: communicate.id,
      title: communicate.title,
      description: communicate.description,
      isActive: communicate.isActive,
      cityId: communicate.cityId,
      userId: communicate.userId,
      authorName: communicate.user.name,
      photos: communicate.photos.map((p) => ({
        id: p.id,
        url: p.url,
        thumbUrl: p.thumbUrl,
        entityType: ENTITY_TYPES.COMMUNICATE,
        entityId: communicate.id,
      })),
      likesCount: communicate._count.likes,
      liked,
      saved,
    };
  }

  private async findCommunicateOrFail(id: string) {
    const communicate = await this.prisma.client.communicate.findUnique({
      where: { id },
    });

    if (!communicate) {
      throw new NotFoundException(
        apiError(COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND),
      );
    }

    return communicate;
  }

  private resolveCityId(
    payloadCityId: string | undefined,
    user: AuthUser,
  ): string {
    const isSuperAdmin = user.role === Role.ADMIN && user.cityId === null;
    if (isSuperAdmin) {
      if (!payloadCityId) {
        throw new BadRequestException(apiError(SHARED_ERRORS.CITY_REQUIRED));
      }
      return payloadCityId;
    }

    if (!user.cityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }

    return user.cityId;
  }

  private validateCityScope(entityCityId: string, user: AuthUser): void {
    const isSuperAdmin = user.role === Role.ADMIN && user.cityId === null;
    if (isSuperAdmin) {
      return;
    }

    if (entityCityId !== user.cityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }
  }

  private requireUser(user?: AuthUser): AuthUser {
    if (!user) {
      throw new UnauthorizedException(apiError(SHARED_ERRORS.UNAUTHENTICATED));
    }

    return user;
  }
}
