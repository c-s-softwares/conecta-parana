import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SavesService } from './saves.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9ZZ`;
const MOCK_EVENT_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2DKEYH9EV`;
const MOCK_COMMUNICATE_ID = `${TABLE_PREFIX.COMMUNICATE}01HZX3Y4Q9F8TAB1C2DKEYH9CM`;
const MOCK_NEWS_ID = `${TABLE_PREFIX.NEWS}01HZX3Y4Q9F8TAB1C2DKEYH9NW`;
const MOCK_LOCAL_ID = `${TABLE_PREFIX.LOCAL}01HZX3Y4Q9F8TAB1C2DKEYH9LC`;

const mockPrisma = {
  client: {
    $queryRaw: jest.fn(),
    event: {
      findUnique: jest.fn(),
    },
    communicate: {
      findUnique: jest.fn(),
    },
    news: {
      findUnique: jest.fn(),
    },
    local: {
      findFirst: jest.fn(),
    },
    save: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
};

describe('SavesService', () => {
  let service: SavesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SavesService>(SavesService);
    jest.clearAllMocks();
  });

  describe('toggleSave', () => {
    it('deve salvar com sucesso (criação)', async () => {
      mockPrisma.client.local.findFirst.mockResolvedValue({
        id: MOCK_LOCAL_ID,
      });
      mockPrisma.client.save.findFirst.mockResolvedValue(null);
      mockPrisma.client.save.create.mockResolvedValue({ id: 'sav_1' });

      const result = await service.toggleSave(
        { localId: MOCK_LOCAL_ID },
        MOCK_USER_ID,
      );

      expect(result).toEqual({ saved: true });
      expect(mockPrisma.client.save.create).toHaveBeenCalled();
    });

    it('deve remover dos salvos com sucesso (remoção)', async () => {
      mockPrisma.client.local.findFirst.mockResolvedValue({
        id: MOCK_LOCAL_ID,
      });
      mockPrisma.client.save.findFirst.mockResolvedValue({ id: 'sav_1' });
      mockPrisma.client.save.delete.mockResolvedValue({ id: 'sav_1' });

      const result = await service.toggleSave(
        { localId: MOCK_LOCAL_ID },
        MOCK_USER_ID,
      );

      expect(result).toEqual({ saved: false });
      expect(mockPrisma.client.save.delete).toHaveBeenCalled();
    });

    it('deve lancar BadRequestException se nenhum target for informado', async () => {
      await expect(service.toggleSave({}, MOCK_USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar BadRequestException se múltiplos targets forem informados (exaustivamente todas as combinações duplas)', async () => {
      // Evento + Notícia
      await expect(
        service.toggleSave(
          { eventId: MOCK_EVENT_ID, newsId: MOCK_NEWS_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Evento + Comunicado
      await expect(
        service.toggleSave(
          { eventId: MOCK_EVENT_ID, communicateId: MOCK_COMMUNICATE_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Evento + Local
      await expect(
        service.toggleSave(
          { eventId: MOCK_EVENT_ID, localId: MOCK_LOCAL_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Comunicado + Notícia
      await expect(
        service.toggleSave(
          { communicateId: MOCK_COMMUNICATE_ID, newsId: MOCK_NEWS_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Comunicado + Local
      await expect(
        service.toggleSave(
          { communicateId: MOCK_COMMUNICATE_ID, localId: MOCK_LOCAL_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      // Notícia + Local
      await expect(
        service.toggleSave(
          { newsId: MOCK_NEWS_ID, localId: MOCK_LOCAL_ID },
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar NotFoundException se a entidade alvo nao existir', async () => {
      mockPrisma.client.local.findFirst.mockResolvedValue(null);

      await expect(
        service.toggleSave({ localId: MOCK_LOCAL_ID }, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMySaves', () => {
    it('deve listar os itens salvos agrupados por tipo corretamente', async () => {
      const mockSaves = [
        {
          id: 'sav_1',
          userId: MOCK_USER_ID,
          eventId: MOCK_EVENT_ID,
          communicateId: null,
          newsId: null,
          localId: null,
          event: {
            id: MOCK_EVENT_ID,
            title: 'Evento Teste',
            eventDate: new Date(),
          },
          communicate: null,
          news: null,
          local: null,
        },
        {
          id: 'sav_2',
          userId: MOCK_USER_ID,
          eventId: null,
          communicateId: null,
          newsId: null,
          localId: MOCK_LOCAL_ID,
          event: null,
          communicate: null,
          news: null,
          local: {
            id: MOCK_LOCAL_ID,
            name: 'Local Teste',
            address: 'Rua Principal',
          },
        },
      ];

      mockPrisma.client.save.findMany.mockResolvedValue(mockSaves);
      mockPrisma.client.$queryRaw.mockImplementation((...args: unknown[]) => {
        const sql = JSON.stringify(args);
        if (sql.includes('locals')) {
          return Promise.resolve([
            { id: MOCK_LOCAL_ID, lng: -49.123, lat: -25.123 },
          ]);
        }
        if (sql.includes('events')) {
          return Promise.resolve([
            { id: MOCK_EVENT_ID, lng: -49.456, lat: -25.456 },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.findMySaves(MOCK_USER_ID);

      expect(result.events).toHaveLength(1);
      expect(result.locals).toHaveLength(1);
      expect(result.communicates).toHaveLength(0);
      expect(result.news).toHaveLength(0);

      const event = result.events[0] as {
        title: string;
        coordinates: { lat: number; lng: number } | null;
      };
      expect(event.title).toBe('Evento Teste');
      expect(event.coordinates).toEqual({
        lat: -25.456,
        lng: -49.456,
      });

      const local = result.locals[0] as {
        name: string;
        coordinates: { lat: number; lng: number } | null;
      };
      expect(local.name).toBe('Local Teste');
      expect(local.coordinates).toEqual({
        lat: -25.123,
        lng: -49.123,
      });
    });
  });
});
