import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { PrismaService } from '../../config/prisma.service';
import { apiError, VALIDATION_FAILED } from '../../common/errors/api-error';
import { CITIES_ERRORS } from '../cities/cities.errors';
import { CACHE_TTL_2_MINUTES } from '../../common/constants/cache.constants';

import { QueryFeedDto } from './dto/request/query-feed.dto';
import { FeedResponseDto } from './dto/response/feed-response.dto';
import { NewsResponse } from '../news/dto/response/news-response.dto';
import { EventResponse } from '../events/dto/response/event-response.dto';
import { CommunicateResponse } from '../communicates/dto/response/communicate-response.dto';

const EVENTS_LIMIT = 4;
const COMMUNICATES_LIMIT = 4;
const WINDOW_PAST_MS = 24 * 60 * 60 * 1000;
const WINDOW_FUTURE_MS = 7 * 24 * 60 * 60 * 1000;
const EVENT_STATUS_PUBLICADO = 'publicado';
const CACHE_KEY_PREFIX = 'feed:v1';

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
};

/**
 * Service do feed combinado da Home Mobile.
 *
 * Limites hardcoded refletem o design da Home: 1 main news + 4 events + 4
 * communicates. Se virar requisito futuro expor isso via query string, basta
 * promover as constantes para parâmetros do DTO.
 *
 * Decisão do MVP: Communicate e News são ordenados por id DESC. Como o id é
 * ULID (cronológico), isso equivale a createdAt DESC sem precisar de coluna
 * nova. TODO: introduzir publishedAt DateTime quando o produto precisar
 * separar "data de publicação" de "data de edição" e "data de criação".
 *
 * TODO: invalidação cross-recurso via pub/sub. Hoje uma mutação em
 * events/communicates/news invalida apenas o cache do path da mutação via
 * HttpCacheInterceptor, não o cache do /feed. O feed pode ficar até 2 minutos
 * stale após uma mutação. Aceitável para o MVP. Quando a entrega imediata
 * virar requisito de produto, introduzir canal pub/sub que dispara
 * invalidação de feed:v1:${cityId} a partir do afterSave/afterDelete dos
 * services de events/communicates/news.
 */
@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getFeed(query: QueryFeedDto): Promise<FeedResponseDto> {
    this.validateProximityParams(query);

    const useCache = query.lat === undefined && query.lng === undefined;
    const cacheKey = this.buildCacheKey(query.cityId);

    if (useCache) {
      const cached = await this.cacheManager.get<FeedResponseDto>(cacheKey);
      if (cached) return cached;
    }

    await this.assertCityExists(query.cityId);

    const [mainNews, priorityEvents, windowEvents, communicates] =
      await Promise.all([
        this.fetchMainNews(query.cityId),
        this.fetchPriorityEvents(query.cityId),
        this.fetchWindowEvents(query.cityId, query.lat, query.lng),
        this.fetchCommunicates(query.cityId),
      ]);

    const events = [...priorityEvents, ...windowEvents].slice(0, EVENTS_LIMIT);

    const response: FeedResponseDto = {
      mainNews,
      events,
      communicates,
    };

    if (useCache) {
      await this.cacheManager.set(cacheKey, response, CACHE_TTL_2_MINUTES);
    }

    return response;
  }

  private buildCacheKey(cityId: string): string {
    return `${CACHE_KEY_PREFIX}:${cityId}`;
  }

  private validateProximityParams(query: QueryFeedDto): void {
    if (query.lng !== undefined && query.lat === undefined) {
      throw new BadRequestException(
        apiError(VALIDATION_FAILED, [
          'lat é obrigatório quando lng é informado',
        ]),
      );
    }
    if (query.lat !== undefined && query.lng === undefined) {
      throw new BadRequestException(
        apiError(VALIDATION_FAILED, [
          'lng é obrigatório quando lat é informado',
        ]),
      );
    }
  }

  private async assertCityExists(cityId: string): Promise<void> {
    const city = await this.prisma.client.city.findFirst({
      where: { id: cityId, deletedAt: null },
      select: { id: true },
    });
    if (!city) {
      throw new NotFoundException(apiError(CITIES_ERRORS.CITY_NOT_FOUND));
    }
  }

  private async fetchMainNews(cityId: string): Promise<NewsResponse | null> {
    const news = await this.prisma.client.news.findFirst({
      where: { cityId, isActive: true },
      orderBy: { id: 'desc' },
    });
    if (!news) return null;
    return {
      id: news.id,
      title: news.title,
      description: news.description,
      type: news.type,
      linkType: news.linkType,
      isActive: news.isActive,
      cityId: news.cityId,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    };
  }

  private async fetchPriorityEvents(cityId: string): Promise<EventResponse[]> {
    const events = await this.prisma.client.event.findMany({
      where: {
        cityId,
        status: EVENT_STATUS_PUBLICADO,
        priority: true,
        deletedAt: null,
      },
      orderBy: { eventDate: 'asc' },
      take: EVENTS_LIMIT,
    });
    return events.map((event) => this.toEventResponse(event));
  }

  private async fetchWindowEvents(
    cityId: string,
    lat?: number,
    lng?: number,
  ): Promise<EventResponse[]> {
    const now = Date.now();
    const start = new Date(now - WINDOW_PAST_MS);
    const end = new Date(now + WINDOW_FUTURE_MS);

    if (lat !== undefined && lng !== undefined) {
      return this.fetchWindowEventsWithProximity(cityId, start, end, lat, lng);
    }

    const events = await this.prisma.client.event.findMany({
      where: {
        cityId,
        status: EVENT_STATUS_PUBLICADO,
        priority: false,
        deletedAt: null,
        eventDate: { gte: start, lte: end },
      },
      orderBy: { eventDate: 'asc' },
      take: EVENTS_LIMIT,
    });
    return events.map((event) => this.toEventResponse(event));
  }

  private async fetchWindowEventsWithProximity(
    cityId: string,
    start: Date,
    end: Date,
    lat: number,
    lng: number,
  ): Promise<EventResponse[]> {
    const rows = await this.prisma.client.$queryRaw<EventEntity[]>`
      SELECT
        id,
        title,
        description,
        type,
        status,
        event_date AS "eventDate",
        city_id AS "cityId",
        user_id AS "userId",
        local_id AS "localId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM events
      WHERE city_id = ${cityId}
        AND status = ${EVENT_STATUS_PUBLICADO}
        AND priority = false
        AND deleted_at IS NULL
        AND event_date >= ${start}
        AND event_date <= ${end}
      ORDER BY
        event_date ASC,
        ST_Distance(
          coordinates::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) ASC NULLS LAST
      LIMIT ${EVENTS_LIMIT}
    `;
    return rows.map((row) => this.toEventResponse(row));
  }

  private async fetchCommunicates(
    cityId: string,
  ): Promise<CommunicateResponse[]> {
    const items = await this.prisma.client.communicate.findMany({
      where: { cityId, isActive: true },
      orderBy: { id: 'desc' },
      take: COMMUNICATES_LIMIT,
    });
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      isActive: item.isActive,
      cityId: item.cityId,
      userId: item.userId,
    }));
  }

  private toEventResponse(event: EventEntity): EventResponse {
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
}
