import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../config/prisma.service';

import { EventsService } from './events.service';

import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_EVENT_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_EVENT = {
  id: MOCK_EVENT_ID,
  title: 'Festa Junina',
  description: 'Evento da cidade',
  type: 'cultural',
  isActive: true,
  eventDate: new Date('2030-06-12T19:00:00Z'),

  cityId: MOCK_CITY_ID,
  userId: 'usr_123',

  localId: null,

  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const MOCK_PHOTO_ID = 'pho_123';
const MOCK_PHOTO_URL = 'https://cdn.example/pho_123.webp';
const MOCK_PHOTO_THUMB = 'https://cdn.example/pho_123-thumb.webp';

const mockPrisma = {
  client: {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },

    local: {
      findFirst: jest.fn(),
    },

    like: {
      findFirst: jest.fn(),
    },

    save: {
      findFirst: jest.fn(),
    },
  },
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de eventos', async () => {
      mockPrisma.client.event.findMany.mockResolvedValue([MOCK_EVENT]);

      mockPrisma.client.event.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 10,
      });

      expect(result.total).toBe(1);

      expect(result.items).toHaveLength(1);
    });

    it('inclui apenas a miniatura (thumbUrl) das fotos na listagem', async () => {
      mockPrisma.client.event.findMany.mockResolvedValue([
        {
          ...MOCK_EVENT,
          photos: [
            {
              id: MOCK_PHOTO_ID,
              thumbUrl: MOCK_PHOTO_THUMB,
            },
          ],
        },
      ]);
      mockPrisma.client.event.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items[0].photos).toEqual([
        { id: MOCK_PHOTO_ID, thumbUrl: MOCK_PHOTO_THUMB },
      ]);
      expect(result.items[0].photos[0]).not.toHaveProperty('url');

      expect(mockPrisma.client.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            photos: {
              select: { id: true, thumbUrl: true },
              orderBy: { id: 'asc' },
            },
          },
        }),
      );
    });

    it('deve aplicar filtros de cityId, type, isActive e categoryId', async () => {
      mockPrisma.client.event.findMany.mockResolvedValue([]);
      mockPrisma.client.event.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 10,
        cityId: MOCK_CITY_ID,
        type: 'cultural',
        isActive: true,
        categoryId: 'cat_123',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const findManyArgs = mockPrisma.client.event.findMany.mock.calls[0][0];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(findManyArgs.where).toMatchObject({
        deletedAt: null,
        cityId: MOCK_CITY_ID,
        type: 'cultural',
        isActive: true,
      });
    });

    it('deve ordenar eventos por data ascendente', async () => {
      mockPrisma.client.event.findMany.mockResolvedValue([]);
      mockPrisma.client.event.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 10,
        order: 'date_asc',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const findManyArgs = mockPrisma.client.event.findMany.mock.calls[0][0];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(findManyArgs.orderBy).toEqual({
        eventDate: 'asc',
      });
    });

    it('deve ordenar eventos por data descendente', async () => {
      mockPrisma.client.event.findMany.mockResolvedValue([]);
      mockPrisma.client.event.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 10,
        order: 'date_desc',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const findManyArgs = mockPrisma.client.event.findMany.mock.calls[0][0];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(findManyArgs.orderBy).toEqual({
        eventDate: 'desc',
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um evento por id', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(MOCK_EVENT);

      const result = await service.findOne(MOCK_EVENT_ID);

      expect(result.id).toBe(MOCK_EVENT_ID);

      expect(mockPrisma.client.event.findFirst).toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando updatedAt for diferente', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue({
        ...MOCK_EVENT,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      mockPrisma.client.event.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        service.update(
          MOCK_EVENT_ID,
          {
            title: 'Novo título',
            updatedAt: '2026-05-30T13:25:59.172Z',
          },
          {
            sub: 'usr_123',
            role: 'ADMIN',
          } as never,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('create', () => {
    it('deve lançar BadRequestException para tipo inválido', async () => {
      await expect(
        service.create(
          {
            title: 'Evento',
            description: 'Teste',
            type: 'abc',
            eventDate: '2030-06-12T19:00:00Z',
            cityId: MOCK_CITY_ID,
          },
          {
            sub: 'usr_123',
            role: 'ADMIN',
          } as never,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para data no passado', async () => {
      await expect(
        service.create(
          {
            title: 'Evento',
            description: 'Teste',
            type: 'cultural',
            eventDate: '2020-01-01T00:00:00Z',
            cityId: MOCK_CITY_ID,
          },
          {
            sub: 'usr_123',
            role: 'ADMIN',
          } as never,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar evento com dados válidos', async () => {
      mockPrisma.client.event.create.mockResolvedValue(MOCK_EVENT);

      const result = await service.create(
        {
          title: 'Festa Junina',
          description: 'Evento da cidade',
          type: 'cultural',
          eventDate: '2030-06-12T19:00:00Z',
          cityId: MOCK_CITY_ID,
        },
        {
          sub: 'usr_123',
          role: 'ADMIN',
        } as never,
      );

      expect(result.id).toBe(MOCK_EVENT_ID);
      expect(result.title).toBe('Festa Junina');
      expect(mockPrisma.client.event.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve lançar ConflictException quando updatedAt for diferente', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue({
        ...MOCK_EVENT,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      await expect(
        service.update(
          MOCK_EVENT_ID,
          {
            title: 'Novo título',
            updatedAt: '2026-05-30T13:25:59.172Z',
          },
          {
            sub: 'usr_123',
            role: 'ADMIN',
          } as never,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ForbiddenException quando ADMIN tentar atualizar evento de outra cidade', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue({
        ...MOCK_EVENT,
        cityId: MOCK_CITY_ID,
      });

      await expect(
        service.update(
          MOCK_EVENT_ID,
          {
            title: 'Tentativa inválida',
            updatedAt: MOCK_EVENT.updatedAt.toISOString(),
          },
          {
            sub: 'usr_123',
            role: 'ADMIN',
            cityId: `${TABLE_PREFIX.CITY}OUTRACIDADE12345678901234`,
          } as never,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve atualizar evento com sucesso', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(MOCK_EVENT);

      mockPrisma.client.event.updateMany.mockResolvedValue({
        count: 1,
      });

      mockPrisma.client.event.findFirst.mockResolvedValueOnce(MOCK_EVENT);

      mockPrisma.client.event.findFirst.mockResolvedValueOnce({
        ...MOCK_EVENT,
        title: 'Evento Atualizado',
      });

      const result = await service.update(
        MOCK_EVENT_ID,
        {
          title: 'Evento Atualizado',
          updatedAt: MOCK_EVENT.updatedAt.toISOString(),
        },
        {
          sub: 'usr_123',
          role: 'ADMIN',
        } as never,
      );

      expect(result.title).toBe('Evento Atualizado');

      expect(mockPrisma.client.event.updateMany).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete do evento', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(MOCK_EVENT);

      mockPrisma.client.event.update.mockResolvedValue({
        ...MOCK_EVENT,
        deletedAt: new Date(),
      });

      await service.remove(MOCK_EVENT_ID, {
        sub: 'usr_123',
        role: 'ADMIN',
      } as never);

      expect(mockPrisma.client.event.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando evento não existir', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(MOCK_EVENT_ID, {
          sub: 'usr_123',
          role: 'ADMIN',
        } as never),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneDetail', () => {
    const USER_ID = 'usr_detail';

    const buildRow = (overrides: Record<string, unknown> = {}) => ({
      ...MOCK_EVENT,
      _count: { likes: 0 },
      ...overrides,
    });

    it('anônimo: retorna likesCount com flags=false (sem queries extras)', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(
        buildRow({ _count: { likes: 9 } }),
      );

      const result = await service.findOneDetail(MOCK_EVENT_ID);

      expect(result.likesCount).toBe(9);
      expect(result.liked).toBe(false);
      expect(result.saved).toBe(false);
      expect(mockPrisma.client.like.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.save.findFirst).not.toHaveBeenCalled();
    });

    it('logado com like e save: ambas as flags true', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(buildRow());
      mockPrisma.client.like.findFirst.mockResolvedValue({ id: 'lke_1' });
      mockPrisma.client.save.findFirst.mockResolvedValue({ id: 'sav_1' });

      const result = await service.findOneDetail(MOCK_EVENT_ID, USER_ID);

      expect(result.liked).toBe(true);
      expect(result.saved).toBe(true);
      expect(mockPrisma.client.like.findFirst).toHaveBeenCalledWith({
        where: { userId: USER_ID, eventId: MOCK_EVENT_ID },
        select: { id: true },
      });
      expect(mockPrisma.client.save.findFirst).toHaveBeenCalledWith({
        where: { userId: USER_ID, eventId: MOCK_EVENT_ID },
        select: { id: true },
      });
    });

    it('logado sem engajamento: ambas as flags false', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(buildRow());
      mockPrisma.client.like.findFirst.mockResolvedValue(null);
      mockPrisma.client.save.findFirst.mockResolvedValue(null);

      const result = await service.findOneDetail(MOCK_EVENT_ID, USER_ID);

      expect(result.liked).toBe(false);
      expect(result.saved).toBe(false);
    });

    it('retorna as fotos com imagem cheia (url) no detalhe', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(
        buildRow({
          photos: [
            {
              id: MOCK_PHOTO_ID,
              url: MOCK_PHOTO_URL,
              thumbUrl: MOCK_PHOTO_THUMB,
            },
          ],
        }),
      );

      const result = await service.findOneDetail(MOCK_EVENT_ID);

      expect(result.photos).toEqual([
        { id: MOCK_PHOTO_ID, url: MOCK_PHOTO_URL, thumbUrl: MOCK_PHOTO_THUMB },
      ]);

      expect(mockPrisma.client.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: { select: { likes: true } },
            photos: {
              select: { id: true, url: true, thumbUrl: true },
              orderBy: { id: 'asc' },
            },
          },
        }),
      );
    });

    it('lança NotFoundException quando evento foi soft-deleted ou inexistente', async () => {
      mockPrisma.client.event.findFirst.mockResolvedValue(null);

      await expect(
        service.findOneDetail(MOCK_EVENT_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
