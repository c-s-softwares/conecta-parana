import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CitiesService } from './cities.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { Prisma } from '@prisma/client';

const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_CITY = {
  id: MOCK_CITY_ID,
  name: 'Paiçandu',
  state: 'PR',
  createdAt: new Date('2026-05-12T10:30:00Z'),
  deletedAt: null,
};

const mockPrisma = {
  client: {
    city: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
};

const mockCache = {
  del: jest.fn(),
};

describe('CitiesService', () => {
  let service: CitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CitiesService>(CitiesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de cidades', async () => {
      mockPrisma.client.city.findMany.mockResolvedValue([MOCK_CITY]);
      mockPrisma.client.city.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result).toEqual({
        items: [
          {
            id: MOCK_CITY_ID,
            name: 'Paiçandu',
            state: 'PR',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it('deve usar defaults quando page/pageSize não são informados e buscar com search', async () => {
      mockPrisma.client.city.findMany.mockResolvedValue([]);
      mockPrisma.client.city.count.mockResolvedValue(0);

      const result = await service.findAll({ search: 'Pai' });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(mockPrisma.client.city.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: expect.objectContaining({
            deletedAt: null,
            name: { contains: 'Pai', mode: 'insensitive' },
          }) as unknown as Prisma.CityWhereInput,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar cidade por ID ignorando excluidas', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);

      const result = await service.findOne(MOCK_CITY_ID);

      expect(result.id).toBe(MOCK_CITY_ID);
      expect(result.name).toBe('Paiçandu');
      expect(mockPrisma.client.city.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_CITY_ID, deletedAt: null },
      });
    });

    it('deve lançar NotFoundException se cidade não existir', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(service.findOne('cit_invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar cidade com ID gerado', async () => {
      mockPrisma.client.city.create.mockResolvedValue(MOCK_CITY);

      const result = await service.create({
        name: 'Paiçandu',
        state: 'PR',
      });

      expect(result.name).toBe('Paiçandu');
      expect(result.state).toBe('PR');
      expect(mockPrisma.client.city.create).toHaveBeenCalledTimes(1);
    });

    it('deve lançar ConflictException(city_duplicate) se ocorrer Unique Constraint (P2002)', async () => {
      mockPrisma.client.city.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '4.0.0',
        }),
      );

      await expect(
        service.create({ name: 'Paiçandu', state: 'PR' }),
      ).rejects.toThrow(new ConflictException('Cidade já cadastrada'));
    });
  });

  describe('update', () => {
    it('deve atualizar cidade', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.city.update.mockResolvedValue({
        ...MOCK_CITY,
        name: 'Maringá',
      });

      const result = await service.update(MOCK_CITY_ID, { name: 'Maringá' });

      expect(result.name).toBe('Maringá');
    });

    it('deve lançar ConflictException(city_duplicate) se Unique Constraint (P2002)', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.city.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '4.0.0',
        }),
      );

      await expect(
        service.update(MOCK_CITY_ID, { name: 'Paiçandu' }),
      ).rejects.toThrow(new ConflictException('Cidade já cadastrada'));
    });
  });

  describe('remove', () => {
    it('deve realizar soft-delete com deletedAt se não houver conteudos associados', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.city.findUnique.mockResolvedValue({
        _count: { users: 0, events: 0, locals: 0, news: 0 },
      });
      mockPrisma.client.city.update.mockResolvedValue(MOCK_CITY);

      await service.remove(MOCK_CITY_ID);

      expect(mockPrisma.client.city.update).toHaveBeenCalledWith({
        where: { id: MOCK_CITY_ID },
        data: { deletedAt: expect.any(Date) as unknown as Date },
      });
    });

    it('deve lançar ConflictException(city_has_content) se houver usuários associados', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.city.findUnique.mockResolvedValue({
        _count: { users: 1, events: 0, locals: 0, news: 0 },
      });

      await expect(service.remove(MOCK_CITY_ID)).rejects.toThrow(
        new ConflictException('Cidade possui conteúdo associado'),
      );
    });
  });
});
