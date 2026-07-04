import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { FeedService } from './feed.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const EVENT_PRIORITY_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2D_PRI_1`;
const EVENT_WINDOW_A_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2D_WIN_A`;
const EVENT_WINDOW_B_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2D_WIN_B`;
const EVENT_NEAR_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2D_NEAR_`;
const EVENT_FAR_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2D_FAR__`;
const COMMUNICATE_RECENT_ID = `${TABLE_PREFIX.COMMUNICATE}01HZX3Y4Q9F8TAB1C2D_NEW_`;
const COMMUNICATE_OLD_ID = `${TABLE_PREFIX.COMMUNICATE}01HZX3Y4Q9F8TAB1C2D_OLD_`;
const NEWS_ID = `${TABLE_PREFIX.NEWS}01HZX3Y4Q9F8TAB1C2DKEYH9NN`;
const LAT = -23.45;
const LNG = -51.95;
const CACHE_KEY = `feed:v1:${MOCK_CITY_ID}`;
const CACHE_TTL_2_MIN = 120000;

const EVENT_DATE_DEFAULT = new Date('2030-06-15T10:00:00Z');
const EVENT_DATE_WINDOW_B = new Date('2030-06-16T10:00:00Z');
const EVENT_DATE_PRIORITY = new Date('2031-01-01T00:00:00Z');
const EVENT_DATE_TIE_BREAK = new Date('2030-06-15T20:00:00Z');
const EVENT_TIMESTAMP = new Date('2026-06-01T00:00:00Z');
const NEWS_TIMESTAMP = new Date('2026-06-10T00:00:00Z');

type EventOverrides = {
  id?: string;
  eventDate?: Date;
  priority?: boolean;
  status?: string;
};

const makeEventEntity = (overrides: EventOverrides = {}) => ({
  id: overrides.id ?? EVENT_WINDOW_A_ID,
  title: 'Evento Teste',
  description: 'Descricao do evento',
  type: 'cultural',
  status: overrides.status ?? 'publicado',
  priority: overrides.priority ?? false,
  eventDate: overrides.eventDate ?? EVENT_DATE_DEFAULT,
  cityId: MOCK_CITY_ID,
  userId: MOCK_USER_ID,
  localId: null,
  createdAt: EVENT_TIMESTAMP,
  updatedAt: EVENT_TIMESTAMP,
  deletedAt: null,
});

const makeCommunicateEntity = (id: string = COMMUNICATE_RECENT_ID) => ({
  id,
  title: 'Comunicado Teste',
  description: 'Descricao do comunicado',
  isActive: true,
  priority: false,
  cityId: MOCK_CITY_ID,
  userId: MOCK_USER_ID,
  photos: [],
});

const makeNewsEntity = () => ({
  id: NEWS_ID,
  title: 'Noticia Principal',
  description: 'Descricao da noticia',
  type: 'geral',
  linkType: 'interno',
  isActive: true,
  cityId: MOCK_CITY_ID,
  createdAt: NEWS_TIMESTAMP,
  updatedAt: NEWS_TIMESTAMP,
  photos: [],
});

const PHOTOS_THUMB_INCLUDE = {
  photos: { select: { id: true, thumbUrl: true } },
};
const USER_SELECT_INCLUDE = { user: { select: { id: true, name: true } } };

describe('FeedService', () => {
  let service: FeedService;
  let mockPrisma: {
    client: {
      city: { findFirst: jest.Mock };
      event: { findMany: jest.Mock };
      communicate: { findMany: jest.Mock };
      news: { findFirst: jest.Mock };
      photo: { findMany: jest.Mock };
      user: { findMany: jest.Mock };
      $queryRaw: jest.Mock;
    };
  };
  let mockCache: { get: jest.Mock; set: jest.Mock };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    mockPrisma = {
      client: {
        city: { findFirst: jest.fn() },
        event: { findMany: jest.fn() },
        communicate: { findMany: jest.fn() },
        news: { findFirst: jest.fn() },
        photo: { findMany: jest.fn() },
        user: { findMany: jest.fn() },
        $queryRaw: jest.fn(),
      },
    };
    mockCache = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);

    mockPrisma.client.city.findFirst.mockResolvedValue({ id: MOCK_CITY_ID });
    mockPrisma.client.event.findMany.mockResolvedValue([]);
    mockPrisma.client.communicate.findMany.mockResolvedValue([]);
    mockPrisma.client.news.findFirst.mockResolvedValue(null);
    mockPrisma.client.photo.findMany.mockResolvedValue([]);
    mockPrisma.client.user.findMany.mockResolvedValue([]);
    mockPrisma.client.$queryRaw.mockResolvedValue([]);
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(undefined);
  });

  describe('validação cross-field lat/lng', () => {
    it('lança validation_failed quando lng informado sem lat', async () => {
      await expect(
        service.getFeed({ cityId: MOCK_CITY_ID, lng: LNG }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança validation_failed quando lat informado sem lng', async () => {
      await expect(
        service.getFeed({ cityId: MOCK_CITY_ID, lat: LAT }),
      ).rejects.toThrow(BadRequestException);
    });

    it('não toca o banco quando a validação cross-field falha', async () => {
      await expect(
        service.getFeed({ cityId: MOCK_CITY_ID, lat: LAT }),
      ).rejects.toThrow();
      expect(mockPrisma.client.city.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.event.findMany).not.toHaveBeenCalled();
    });
  });

  describe('cidade inexistente', () => {
    it('lança city_not_found quando a cidade não existe', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValueOnce(null);
      await expect(service.getFeed({ cityId: MOCK_CITY_ID })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('merge de events', () => {
    it('sem priority em nenhum bucket, retorna apenas window events em ordem do banco', async () => {
      const windowA = makeEventEntity({ id: EVENT_WINDOW_A_ID });
      const windowB = makeEventEntity({
        id: EVENT_WINDOW_B_ID,
        eventDate: EVENT_DATE_WINDOW_B,
      });
      mockPrisma.client.event.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([windowA, windowB]);

      const result = await service.getFeed({ cityId: MOCK_CITY_ID });

      expect(result.events.map((e) => e.id)).toEqual([
        EVENT_WINDOW_A_ID,
        EVENT_WINDOW_B_ID,
      ]);
    });

    it('priority=true salta para o topo dos events, antes do bucket de janela', async () => {
      const priority = makeEventEntity({
        id: EVENT_PRIORITY_ID,
        priority: true,
        eventDate: EVENT_DATE_PRIORITY,
      });
      const windowA = makeEventEntity({ id: EVENT_WINDOW_A_ID });
      mockPrisma.client.event.findMany
        .mockResolvedValueOnce([priority])
        .mockResolvedValueOnce([windowA]);

      const result = await service.getFeed({ cityId: MOCK_CITY_ID });

      expect(result.events.map((e) => e.id)).toEqual([
        EVENT_PRIORITY_ID,
        EVENT_WINDOW_A_ID,
      ]);
    });

    it('limita events ao máximo de 4 quando há mais que isso entre os dois buckets', async () => {
      const priorities = [
        makeEventEntity({ id: 'evt_pri_1', priority: true }),
        makeEventEntity({ id: 'evt_pri_2', priority: true }),
        makeEventEntity({ id: 'evt_pri_3', priority: true }),
        makeEventEntity({ id: 'evt_pri_4', priority: true }),
      ];
      const windowExtras = [
        makeEventEntity({ id: 'evt_win_1' }),
        makeEventEntity({ id: 'evt_win_2' }),
      ];
      mockPrisma.client.event.findMany
        .mockResolvedValueOnce(priorities)
        .mockResolvedValueOnce(windowExtras);

      const result = await service.getFeed({ cityId: MOCK_CITY_ID });

      expect(result.events).toHaveLength(4);
      expect(result.events.map((e) => e.id)).toEqual([
        'evt_pri_1',
        'evt_pri_2',
        'evt_pri_3',
        'evt_pri_4',
      ]);
    });

    it('evita duplicidade priority/window filtrando priority=false e a janela [-1d, +7d] no bucket de janela', async () => {
      await service.getFeed({ cityId: MOCK_CITY_ID });

      expect(mockPrisma.client.event.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            priority: false,
            eventDate: {
              gte: expect.any(Date) as Date,
              lte: expect.any(Date) as Date,
            },
          }) as unknown,
        }),
      );
    });
  });

  describe('proximidade (lat/lng)', () => {
    it('usa $queryRaw para a janela quando lat/lng informados, sem findMany do bucket window', async () => {
      const near = makeEventEntity({ id: EVENT_NEAR_ID });
      const far = makeEventEntity({ id: EVENT_FAR_ID });
      mockPrisma.client.event.findMany.mockResolvedValueOnce([]);
      mockPrisma.client.$queryRaw.mockResolvedValueOnce([near, far]);

      const result = await service.getFeed({
        cityId: MOCK_CITY_ID,
        lat: LAT,
        lng: LNG,
      });

      expect(mockPrisma.client.$queryRaw).toHaveBeenCalledTimes(1);
      expect(mockPrisma.client.event.findMany).toHaveBeenCalledTimes(1);
      expect(result.events.map((e) => e.id)).toEqual([
        EVENT_NEAR_ID,
        EVENT_FAR_ID,
      ]);
    });

    it('respeita a ordem retornada pelo SQL (tie-break por proximidade já vem ordenado do banco)', async () => {
      const near = makeEventEntity({
        id: EVENT_NEAR_ID,
        eventDate: EVENT_DATE_TIE_BREAK,
      });
      const far = makeEventEntity({
        id: EVENT_FAR_ID,
        eventDate: EVENT_DATE_TIE_BREAK,
      });
      mockPrisma.client.event.findMany.mockResolvedValueOnce([]);
      mockPrisma.client.$queryRaw.mockResolvedValueOnce([near, far]);

      const result = await service.getFeed({
        cityId: MOCK_CITY_ID,
        lat: LAT,
        lng: LNG,
      });

      expect(result.events.map((e) => e.id)).toEqual([
        EVENT_NEAR_ID,
        EVENT_FAR_ID,
      ]);
    });
  });

  describe('mainNews', () => {
    it('retorna null quando a cidade não tem nenhuma notícia ativa', async () => {
      mockPrisma.client.news.findFirst.mockResolvedValueOnce(null);
      const result = await service.getFeed({ cityId: MOCK_CITY_ID });
      expect(result.mainNews).toBeNull();
    });

    it('retorna a notícia ativa mais recente quando existe', async () => {
      mockPrisma.client.news.findFirst.mockResolvedValueOnce(makeNewsEntity());
      const result = await service.getFeed({ cityId: MOCK_CITY_ID });
      expect(result.mainNews).toMatchObject({
        id: NEWS_ID,
        isActive: true,
      });
    });

    it('busca notícia ativa ordenada por id desc', async () => {
      await service.getFeed({ cityId: MOCK_CITY_ID });
      expect(mockPrisma.client.news.findFirst).toHaveBeenCalledWith({
        where: { cityId: MOCK_CITY_ID, isActive: true },
        orderBy: { id: 'desc' },
        include: { ...PHOTOS_THUMB_INCLUDE, ...USER_SELECT_INCLUDE },
      });
    });
  });

  describe('communicates', () => {
    it('busca ativos ordenados por id desc com limite 4', async () => {
      mockPrisma.client.communicate.findMany.mockResolvedValueOnce([
        makeCommunicateEntity(COMMUNICATE_RECENT_ID),
        makeCommunicateEntity(COMMUNICATE_OLD_ID),
      ]);
      const result = await service.getFeed({ cityId: MOCK_CITY_ID });

      expect(mockPrisma.client.communicate.findMany).toHaveBeenCalledWith({
        where: { cityId: MOCK_CITY_ID, isActive: true },
        orderBy: { id: 'desc' },
        take: 4,
        include: { ...PHOTOS_THUMB_INCLUDE, ...USER_SELECT_INCLUDE },
      });
      expect(result.communicates.map((c) => c.id)).toEqual([
        COMMUNICATE_RECENT_ID,
        COMMUNICATE_OLD_ID,
      ]);
    });
  });

  describe('cache', () => {
    it('retorna do cache sem tocar o banco quando hit e lat/lng ausentes', async () => {
      const cached = {
        mainNews: null,
        events: [],
        communicates: [],
      };
      mockCache.get.mockResolvedValueOnce(cached);

      const result = await service.getFeed({ cityId: MOCK_CITY_ID });

      expect(result).toEqual(cached);
      expect(mockCache.get).toHaveBeenCalledWith(CACHE_KEY);
      expect(mockPrisma.client.city.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.event.findMany).not.toHaveBeenCalled();
    });

    it('grava no cache após miss em chamada sem lat/lng', async () => {
      await service.getFeed({ cityId: MOCK_CITY_ID });
      expect(mockCache.set).toHaveBeenCalledWith(
        CACHE_KEY,
        { mainNews: null, events: [], communicates: [] },
        CACHE_TTL_2_MIN,
      );
    });

    it('não usa cache (nem get nem set) quando lat/lng presentes', async () => {
      await service.getFeed({ cityId: MOCK_CITY_ID, lat: LAT, lng: LNG });
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});
