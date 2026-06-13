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
  status: 'publicado',
  eventDate: new Date('2026-06-12T19:00:00Z'),

  cityId: MOCK_CITY_ID,
  userId: 'usr_123',

  localId: null,

  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

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

    it('deve aplicar filtros de cityId, type, status e categoryId', async () => {
      mockPrisma.client.event.findMany.mockResolvedValue([]);
      mockPrisma.client.event.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 10,
        cityId: MOCK_CITY_ID,
        type: 'cultural',
        status: 'publicado',
        categoryId: 'cat_123',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const findManyArgs = mockPrisma.client.event.findMany.mock.calls[0][0];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(findManyArgs.where).toMatchObject({
        deletedAt: null,
        cityId: MOCK_CITY_ID,
        type: 'cultural',
        status: 'publicado',
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
            status: 'publicado',
            eventDate: '2026-06-12T19:00:00Z',
            cityId: MOCK_CITY_ID,
          },
          {
            sub: 'usr_123',
            role: 'ADMIN',
          } as never,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para status inválido', async () => {
      await expect(
        service.create(
          {
            title: 'Evento',
            description: 'Teste',
            type: 'cultural',
            status: 'abc',
            eventDate: '2026-06-12T19:00:00Z',
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
            status: 'publicado',
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
          status: 'publicado',
          eventDate: '2026-06-12T19:00:00Z',
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
});
