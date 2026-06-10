import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../config/prisma.service';
import { CreateLikeToggleDto } from './dto/request/create-like-toggle.dto';
import { LikeToggleResponseDto } from './dto/response/like-toggle-response.dto';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';
import { CACHE_TTL_30_SECONDS } from '../../common/constants/cache.constants';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async toggleLike(
    dto: CreateLikeToggleDto,
    userId: string,
  ): Promise<LikeToggleResponseDto> {
    const { eventId, communicateId, newsId } = dto;
    const targets = [eventId, communicateId, newsId].filter(Boolean);

    if (targets.length === 0) {
      throw new BadRequestException(apiError(SHARED_ERRORS.NO_TARGET));
    }
    if (targets.length > 1) {
      throw new BadRequestException(apiError(SHARED_ERRORS.MULTIPLE_TARGETS));
    }

    let targetType: 'event' | 'communicate' | 'news';
    let targetId: string;
    let targetField: 'eventId' | 'communicateId' | 'newsId';

    if (eventId) {
      targetType = 'event';
      targetId = eventId;
      targetField = 'eventId';
    } else if (communicateId) {
      targetType = 'communicate';
      targetId = communicateId;
      targetField = 'communicateId';
    } else {
      targetType = 'news';
      targetId = newsId!;
      targetField = 'newsId';
    }

    // Verificar se a entidade alvo existe
    await this.assertTargetExists(targetType, targetId);

    // Verificar se o like já existe
    const existingLike = await this.prisma.client.like.findFirst({
      where: {
        userId,
        [targetField]: targetId,
      },
    });

    let liked = false;
    if (existingLike) {
      await this.prisma.client.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await this.prisma.client.like.create({
        data: {
          id: generateId(TABLE_PREFIX.LIKE),
          userId,
          [targetField]: targetId,
        },
      });
      liked = true;
    }

    // Gerenciamento de Cache
    const cacheKey = `likes:count:${targetType}:${targetId}`;

    // Invalida o cache imediatamente
    await this.cacheManager.del(cacheKey);

    // Recalcula o total
    const count = await this.prisma.client.like.count({
      where: {
        [targetField]: targetId,
      },
    });

    // Repovoa o cache com TTL 30s
    await this.cacheManager.set(cacheKey, count, CACHE_TTL_30_SECONDS);

    return { liked, count };
  }

  async getLikesCount(
    targetType: 'event' | 'communicate' | 'news',
    targetId: string,
  ): Promise<number> {
    const cacheKey = `likes:count:${targetType}:${targetId}`;
    const cached = await this.cacheManager.get<number>(cacheKey);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const targetField =
      targetType === 'event'
        ? 'eventId'
        : targetType === 'communicate'
          ? 'communicateId'
          : 'newsId';

    const count = await this.prisma.client.like.count({
      where: {
        [targetField]: targetId,
      },
    });

    await this.cacheManager.set(cacheKey, count, CACHE_TTL_30_SECONDS);
    return count;
  }

  private async assertTargetExists(
    targetType: 'event' | 'communicate' | 'news',
    targetId: string,
  ): Promise<void> {
    let exists = false;

    if (targetType === 'event') {
      const item = await this.prisma.client.event.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      exists = !!item;
    } else if (targetType === 'communicate') {
      const item = await this.prisma.client.communicate.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      exists = !!item;
    } else if (targetType === 'news') {
      const item = await this.prisma.client.news.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      exists = !!item;
    }

    if (!exists) {
      throw new NotFoundException(apiError(SHARED_ERRORS.TARGET_NOT_FOUND));
    }
  }
}
