import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';

import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ENTITY_TYPES } from '../uploads/constants/entity-type';

import { NEWS_ERRORS } from './news.errors';
import { CreateNewsDto } from './dto/request/create-news.dto';
import { UpdateNewsDto } from './dto/request/update-news.dto';
import { QueryNewsDto } from './dto/request/query-news.dto';
import {
  NewsDetailResponse,
  NewsResponse,
} from './dto/response/news-response.dto';
import { VALID_LINK_TYPES, VALID_NEWS_TYPES } from './constants/news.constants';

@Injectable()
export class NewsService extends BaseCrudService<
  NewsResponse,
  CreateNewsDto,
  UpdateNewsDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.NEWS,
      entityName: 'Notícia',
      softDelete: false,
      notFoundErrorKey: NEWS_ERRORS.NEWS_NOT_FOUND,
    });
  }

  protected getDelegate() {
    return this.prisma.client.news;
  }

  protected toResponse(entity: unknown): NewsResponse {
    const news = entity as NewsResponse & {
      photos?: { id: string; thumbUrl: string | null }[];
    };
    return {
      ...news,
      photos: (news.photos ?? []).map((photo) => ({
        id: photo.id,
        thumbUrl: photo.thumbUrl,
      })),
    };
  }

  protected toCreateData(
    dto: CreateNewsDto & { userId?: string },
  ): Record<string, unknown> {
    this.validateType(dto.type);
    this.validateLinkType(dto.linkType);

    /**
     * TODO (pós-MVP): introduzir coluna priority em News,
     * espelhando o que foi feito em Event e Communicate. Hoje a Home
     * Mobile usa apenas 1 notícia (a mais recente ativa) como destaque, então a
     * flag não é necessária.
     * */
    return {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      linkType: dto.linkType,
      // linkUrl so vai pro banco quando linkType=externo (regra do produto).
      linkUrl: dto.linkType === 'externo' ? (dto.linkUrl ?? null) : null,
      isActive: dto.isActive ?? true,
      cityId: dto.cityId,
      userId: dto.userId ?? null,
    };
  }

  protected toUpdateData(dto: UpdateNewsDto): Record<string, unknown> {
    if (dto.type !== undefined) {
      this.validateType(dto.type);
    }

    if (dto.linkType !== undefined) {
      this.validateLinkType(dto.linkType);
    }

    return {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && {
        description: dto.description,
      }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.linkType !== undefined && {
        linkType: dto.linkType,
        // Quando linkType muda, sincroniza linkUrl (apaga em interno, atualiza em externo).
        linkUrl: dto.linkType === 'externo' ? (dto.linkUrl ?? null) : null,
      }),
      ...(dto.linkType === undefined &&
        dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
      ...(dto.isActive !== undefined && {
        isActive: dto.isActive,
      }),
    };
  }

  protected override buildSearchWhere(
    query: QueryNewsDto,
  ): Record<string, unknown> {
    return {
      ...(query.cityId !== undefined && { cityId: query.cityId }),
      ...(query.type !== undefined && { type: query.type }),
      isActive: query.isActive !== undefined ? query.isActive === 'true' : true,
    };
  }

  protected override buildBaseWhere(): Record<string, unknown> {
    return { isActive: true };
  }

  override async findAll(query: QueryNewsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = {
      ...this.buildBaseWhere(),
      ...this.buildSearchWhere(query),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.news.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { photos: { select: { id: true, thumbUrl: true } } },
      }),
      this.prisma.client.news.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateNewsDto, user?: JwtPayload): Promise<NewsResponse> {
    const currentUser = this.requireUser(user);
    const cityId = this.resolveCityId(dto.cityId, currentUser);

    return super.create({
      ...dto,
      cityId,
      userId: currentUser.sub,
    } as CreateNewsDto);
  }

  async update(
    id: string,
    dto: UpdateNewsDto,
    user?: JwtPayload,
  ): Promise<NewsResponse> {
    const currentUser = this.requireUser(user);
    const current = await this.findOne(id);

    this.validateAdminCityScope(current.cityId, currentUser);

    return super.update(id, {
      ...dto,
    });
  }

  async remove(id: string, user?: JwtPayload): Promise<void> {
    const currentUser = this.requireUser(user);
    const current = await this.findOne(id);

    this.validateAdminCityScope(current.cityId, currentUser);

    await this.prisma.client.news.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Detalhe da notícia para o GET /news/:id. Inclui photos, likesCount e flags
   * de engajamento por usuário logado. Quando userId não é informado (anônimo),
   * liked/saved são false e não há query extra. Quando informado, dispara 2
   * queries adicionais (like + save) em paralelo.
   */
  async findOneDetail(
    id: string,
    userId?: string,
  ): Promise<NewsDetailResponse> {
    const news = await this.prisma.client.news.findFirst({
      where: { id, isActive: true },
      include: {
        photos: true,
        _count: { select: { likes: true } },
      },
    });

    if (!news) {
      throw new NotFoundException(apiError(NEWS_ERRORS.NEWS_NOT_FOUND));
    }

    let liked = false;
    let saved = false;
    if (userId) {
      const [likeExists, saveExists] = await Promise.all([
        this.prisma.client.like.findFirst({
          where: { userId, newsId: id },
          select: { id: true },
        }),
        this.prisma.client.save.findFirst({
          where: { userId, newsId: id },
          select: { id: true },
        }),
      ]);
      liked = !!likeExists;
      saved = !!saveExists;
    }

    return {
      id: news.id,
      title: news.title,
      description: news.description,
      type: news.type,
      linkType: news.linkType,
      linkUrl: news.linkUrl,
      isActive: news.isActive,
      cityId: news.cityId,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      photos: news.photos.map((p) => ({
        id: p.id,
        url: p.url,
        thumbUrl: p.thumbUrl,
        entityType: ENTITY_TYPES.NEWS,
        entityId: news.id,
      })),
      likesCount: news._count.likes,
      liked,
      saved,
    };
  }

  private requireUser(user?: JwtPayload): JwtPayload {
    if (!user) {
      throw new UnauthorizedException(apiError(SHARED_ERRORS.UNAUTHENTICATED));
    }

    return user;
  }

  private resolveCityId(cityId: string | undefined, user: JwtPayload): string {
    if (user.role === Role.ADMIN && user.cityId) {
      return user.cityId;
    }

    if (!cityId) {
      throw new BadRequestException(apiError(SHARED_ERRORS.CITY_REQUIRED));
    }

    return cityId;
  }

  private validateAdminCityScope(cityId: string, user: JwtPayload): void {
    if (user.role === Role.ADMIN && user.cityId && user.cityId !== cityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }
  }

  private validateType(type: string): void {
    if (!VALID_NEWS_TYPES.includes(type)) {
      throw new BadRequestException(apiError(NEWS_ERRORS.INVALID_TYPE));
    }
  }

  private validateLinkType(linkType: string): void {
    if (!VALID_LINK_TYPES.includes(linkType)) {
      throw new BadRequestException(apiError(NEWS_ERRORS.INVALID_LINK_TYPE));
    }
  }
}
