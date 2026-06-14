import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';

import { JwtPayload } from '../auth/strategies/jwt.strategy';

import { NEWS_ERRORS } from './news.errors';
import { CreateNewsDto } from './dto/request/create-news.dto';
import { UpdateNewsDto } from './dto/request/update-news.dto';
import { QueryNewsDto } from './dto/request/query-news.dto';
import { NewsResponse } from './dto/response/news-response.dto';
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
    return entity as NewsResponse;
  }

  protected toCreateData(dto: CreateNewsDto): Record<string, unknown> {
    this.validateType(dto.type);
    this.validateLinkType(dto.linkType);

    return {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      linkType: dto.linkType,
      isActive: dto.isActive ?? true,
      cityId: dto.cityId,
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
      }),
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

  async create(dto: CreateNewsDto, user?: JwtPayload): Promise<NewsResponse> {
    const currentUser = this.requireUser(user);
    const cityId = this.resolveCityId(dto.cityId, currentUser);

    return super.create({
      ...dto,
      cityId,
    });
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
