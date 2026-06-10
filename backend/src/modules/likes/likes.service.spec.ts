import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LikesService } from './likes.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9ZZ`;
const MOCK_EVENT_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2DKEYH9EV`;
const MOCK_COMMUNICATE_ID = `${TABLE_PREFIX.COMMUNICATE}01HZX3Y4Q9F8TAB1C2DKEYH9CM`;
const MOCK_NEWS_ID = `${TABLE_PREFIX.NEWS}01HZX3Y4Q9F8TAB1C2DKEYH9NW`;

const mockPrisma = {
  client: {
    event: {
      findUnique: jest.fn(),
    },
    communicate: {
      findUnique: jest.fn(),
    },
    news: {
      findUnique: jest.fn(),
    },
    like: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
};

const cacheMap = new Map<string, unknown>();
const mockCache = {
  get: jest.fn((key: string) => cacheMap.get(key)),
  set: jest.fn((key: string, value: unknown) => {
    cacheMap.set(key, value);
    return Promise.resolve();
  }),
  del: jest.fn((key: string) => {
    cacheMap.delete(key);
    return Promise.resolve();
  }),
};

describe('LikesService', () => {
  let service: LikesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    jest.clearAllMocks();
    cacheMap.clear();
  });

  describe('toggleLike', () => {
    it('deve dar like com sucesso (criação)', async () => {
      mockPrisma.client.event.findUnique.mockResolvedValue({
        id: MOCK_EVENT_ID,
      });
      mockPrisma.client.like.findFirst.mockResolvedValue(null);
      mockPrisma.client.like.create.mockResolvedValue({ id: 'lke_1' });
      mockPrisma.client.like.count.mockResolvedValue(5);

      const result = await service.toggleLike(
        { eventId: MOCK_EVENT_ID },
        MOCK_USER_ID,
      );

      expect(result).toEqual({ liked: true, count: 5 });
      expect(mockPrisma.client.like.create).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalledWith(
        `likes:count:event:${MOCK_EVENT_ID}`,
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        `likes:count:event:${MOCK_EVENT_ID}`,
        5,
        30000,
      );
    });

    it('deve remover o like com sucesso (remoção)', async () => {
      mockPrisma.client.event.findUnique.mockResolvedValue({
        id: MOCK_EVENT_ID,
      });
      mockPrisma.client.like.findFirst.mockResolvedValue({ id: 'lke_1' });
      mockPrisma.client.like.delete.mockResolvedValue({ id: 'lke_1' });
      mockPrisma.client.like.count.mockResolvedValue(4);

      const result = await service.toggleLike(
        { eventId: MOCK_EVENT_ID },
        MOCK_USER_ID,
      );

      expect(result).toEqual({ liked: false, count: 4 });
      expect(mockPrisma.client.like.delete).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalledWith(
        `likes:count:event:${MOCK_EVENT_ID}`,
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        `likes:count:event:${MOCK_EVENT_ID}`,
        4,
        30000,
      );
    });

    it('deve lancar BadRequestException se nenhum target for informado', async () => {
      await expect(service.toggleLike({}, MOCK_USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar BadRequestException se múltiplos targets forem informados (todas as combinações de targets duplos)', async () => {
      // Evento + Notícia
      await expect(
        service.toggleLike(
          { eventId: MOCK_EVENT_ID, newsId: MOCK_NEWS_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Evento + Comunicado
      await expect(
        service.toggleLike(
          { eventId: MOCK_EVENT_ID, communicateId: MOCK_COMMUNICATE_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Comunicado + Notícia
      await expect(
        service.toggleLike(
          { communicateId: MOCK_COMMUNICATE_ID, newsId: MOCK_NEWS_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar NotFoundException se a entidade alvo nao existir', async () => {
      mockPrisma.client.event.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleLike({ eventId: MOCK_EVENT_ID }, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLikesCount (Cache)', () => {
    it('deve ler do banco de dados na primeira chamada e popular o cache', async () => {
      mockPrisma.client.like.count.mockResolvedValue(10);

      const result = await service.getLikesCount('event', MOCK_EVENT_ID);

      expect(result).toBe(10);
      expect(mockPrisma.client.like.count).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        `likes:count:event:${MOCK_EVENT_ID}`,
        10,
        30000,
      );
    });

    it('deve retornar do cache na segunda chamada sem consultar o banco de dados', async () => {
      mockPrisma.client.like.count.mockResolvedValue(10);

      // Primeira chamada -> popula cache
      await service.getLikesCount('event', MOCK_EVENT_ID);
      expect(mockPrisma.client.like.count).toHaveBeenCalledTimes(1);

      // Segunda chamada -> deve retornar do cache
      const cachedResult = await service.getLikesCount('event', MOCK_EVENT_ID);
      expect(cachedResult).toBe(10);
      expect(mockPrisma.client.like.count).toHaveBeenCalledTimes(1); // Continua 1, não chamou de novo
    });
  });
});
