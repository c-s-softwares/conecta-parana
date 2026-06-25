import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { CreateSaveToggleDto } from './dto/request/create-save-toggle.dto';
import { SaveToggleResponseDto } from './dto/response/save-toggle-response.dto';
import { SavesGroupedResponseDto } from './dto/response/saves-grouped-response.dto';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';

@Injectable()
export class SavesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleSave(
    dto: CreateSaveToggleDto,
    userId: string,
  ): Promise<SaveToggleResponseDto> {
    const { eventId, communicateId, newsId, localId } = dto;
    const targets = [eventId, communicateId, newsId, localId].filter(Boolean);

    if (targets.length === 0) {
      throw new BadRequestException(apiError(SHARED_ERRORS.NO_TARGET));
    }
    if (targets.length > 1) {
      throw new BadRequestException(apiError(SHARED_ERRORS.MULTIPLE_TARGETS));
    }

    let targetType: 'event' | 'communicate' | 'news' | 'local';
    let targetId: string;
    let targetField: 'eventId' | 'communicateId' | 'newsId' | 'localId';

    if (eventId) {
      targetType = 'event';
      targetId = eventId;
      targetField = 'eventId';
    } else if (communicateId) {
      targetType = 'communicate';
      targetId = communicateId;
      targetField = 'communicateId';
    } else if (newsId) {
      targetType = 'news';
      targetId = newsId;
      targetField = 'newsId';
    } else {
      targetType = 'local';
      targetId = localId!;
      targetField = 'localId';
    }

    // Verificar se a entidade alvo existe
    await this.assertTargetExists(targetType, targetId);

    // Tentar deletar o save existente de forma otimizada
    const deleteResult = await this.prisma.client.save.deleteMany({
      where: {
        userId,
        [targetField]: targetId,
      },
    });

    let saved = false;
    if (deleteResult.count > 0) {
      saved = false;
    } else {
      try {
        await this.prisma.client.save.create({
          data: {
            id: generateId(TABLE_PREFIX.SAVE),
            userId,
            [targetField]: targetId,
          },
        });
        saved = true;
      } catch (error) {
        // Se ocorrer um erro de duplicidade (P2002) devido a concorrência, consideramos que o save foi criado por outro processo
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          saved = true;
        } else {
          throw error;
        }
      }
    }

    return { saved };
  }

  async findMySaves(userId: string): Promise<SavesGroupedResponseDto> {
    const saves = await this.prisma.client.save.findMany({
      where: { userId },
      include: {
        event: true,
        communicate: {
          where: { isActive: true },
        },
        news: {
          where: { isActive: true },
        },
        local: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const localIds = saves.map((s) => s.local?.id).filter(Boolean) as string[];
    const eventIds = saves.map((s) => s.event?.id).filter(Boolean) as string[];

    // Buscar e mapear as coordenadas dos Locals
    const localCoordsMap = new Map<string, { lat: number; lng: number }>();
    if (localIds.length > 0) {
      const localCoords = await this.prisma.client.$queryRaw<
        { id: string; lng: number | null; lat: number | null }[]
      >`
        SELECT id, ST_X(coordinates) as lng, ST_Y(coordinates) as lat
        FROM locals
        WHERE id = ANY(${localIds})
      `;
      for (const row of localCoords) {
        if (row.lat !== null && row.lng !== null) {
          localCoordsMap.set(row.id, { lat: row.lat, lng: row.lng });
        }
      }
    }

    // Buscar e mapear as coordenadas dos Events
    const eventCoordsMap = new Map<string, { lat: number; lng: number }>();
    if (eventIds.length > 0) {
      const eventCoords = await this.prisma.client.$queryRaw<
        { id: string; lng: number | null; lat: number | null }[]
      >`
        SELECT id, ST_X(coordinates) as lng, ST_Y(coordinates) as lat
        FROM events
        WHERE id = ANY(${eventIds})
      `;
      for (const row of eventCoords) {
        if (row.lat !== null && row.lng !== null) {
          eventCoordsMap.set(row.id, { lat: row.lat, lng: row.lng });
        }
      }
    }

    const result: SavesGroupedResponseDto = {
      events: [],
      communicates: [],
      news: [],
      locals: [],
    };

    for (const save of saves) {
      if (save.event) {
        const coords = eventCoordsMap.get(save.event.id) ?? null;
        result.events.push({
          id: save.event.id,
          title: save.event.title,
          description: save.event.description,
          type: save.event.type,
          isActive: save.event.isActive,
          eventDate: save.event.eventDate,
          cityId: save.event.cityId,
          userId: save.event.userId,
          localId: save.event.localId,
          coordinates: coords,
        });
      } else if (save.communicate) {
        result.communicates.push({
          id: save.communicate.id,
          title: save.communicate.title,
          description: save.communicate.description,
          isActive: save.communicate.isActive,
          cityId: save.communicate.cityId,
          userId: save.communicate.userId,
        });
      } else if (save.news) {
        result.news.push({
          id: save.news.id,
          title: save.news.title,
          description: save.news.description,
          type: save.news.type,
          linkType: save.news.linkType,
          isActive: save.news.isActive,
          cityId: save.news.cityId,
        });
      } else if (save.local) {
        const coords = localCoordsMap.get(save.local.id) ?? null;
        result.locals.push({
          id: save.local.id,
          name: save.local.name,
          description: save.local.description ?? '',
          address: save.local.address,
          phone: save.local.phone ?? '',
          cityId: save.local.cityId,
          categoryId: save.local.categoryId,
          userId: save.local.userId,
          coordinates: coords,
        });
      }
    }

    return result;
  }

  private async assertTargetExists(
    targetType: 'event' | 'communicate' | 'news' | 'local',
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
    } else if (targetType === 'local') {
      const item = await this.prisma.client.local.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { id: true },
      });
      exists = !!item;
    }

    if (!exists) {
      throw new NotFoundException(apiError(SHARED_ERRORS.TARGET_NOT_FOUND));
    }
  }
}
