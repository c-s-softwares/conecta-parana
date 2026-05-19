import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LocalsService } from './locals.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_LOCAL_ID = `${TABLE_PREFIX.LOCAL}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9CC`;
const MOCK_CATEGORY_ID = `${TABLE_PREFIX.CATEGORY}01HZX3Y4Q9F8TAB1C2DKEYH9XY`;
const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9ZZ`;

const MOCK_LOCAL = {
  id: MOCK_LOCAL_ID,
  name: 'UPA Centro',
  description: 'Unidade de Pronto Atendimento',
  address: 'Rua das Flores, 123',
  phone: '(44) 3221-1234',
  cityId: MOCK_CITY_ID,
  categoryId: MOCK_CATEGORY_ID,
  userId: MOCK_USER_ID,
};

const mockPrisma = {
  client: {
    local: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
};

describe('LocalsService', () => {
  let service: LocalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LocalsService>(LocalsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de locais e buscar coordenadas de forma agregada', async () => {
      mockPrisma.client.local.findMany.mockResolvedValue([MOCK_LOCAL]);
      mockPrisma.client.local.count.mockResolvedValue(1);
      mockPrisma.client.$queryRaw.mockResolvedValue([
        { id: MOCK_LOCAL_ID, lng: -51.95, lat: -23.45 },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items[0].id).toBe(MOCK_LOCAL_ID);
      expect(result.items[0].coordinates).toEqual({ lat: -23.45, lng: -51.95 });
      expect(mockPrisma.client.local.findMany).toHaveBeenCalled();
      expect(mockPrisma.client.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar local por ID e buscar suas coordenadas', async () => {
      mockPrisma.client.local.findFirst.mockResolvedValue(MOCK_LOCAL);
      mockPrisma.client.$queryRaw.mockResolvedValue([
        { lng: -51.95, lat: -23.45 },
      ]);

      const result = await service.findOne(MOCK_LOCAL_ID);

      expect(result.id).toBe(MOCK_LOCAL_ID);
      expect(result.coordinates).toEqual({ lat: -23.45, lng: -51.95 });
    });

    it('deve lancar NotFoundException se o local nao existir', async () => {
      mockPrisma.client.local.findFirst.mockResolvedValue(null);

      await expect(service.findOne('loc_invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar local sem coordenadas se nao forem informadas', async () => {
      mockPrisma.client.local.create.mockResolvedValue(MOCK_LOCAL);

      const result = await service.create({
        name: 'UPA Centro',
        description: 'Unidade de Pronto Atendimento',
        address: 'Rua das Flores, 123',
        phone: '(44) 3221-1234',
        cityId: MOCK_CITY_ID,
        categoryId: MOCK_CATEGORY_ID,
        userId: MOCK_USER_ID,
      });

      expect(result.name).toBe('UPA Centro');
      expect(result.coordinates).toBeNull();
      expect(mockPrisma.client.$executeRaw).not.toHaveBeenCalled();
    });

    it('deve criar local e atualizar coordenadas via raw SQL se fornecidas', async () => {
      mockPrisma.client.local.create.mockResolvedValue(MOCK_LOCAL);
      mockPrisma.client.$executeRaw.mockResolvedValue(1);

      const result = await service.create({
        name: 'UPA Centro',
        description: 'Unidade de Pronto Atendimento',
        address: 'Rua das Flores, 123',
        phone: '(44) 3221-1234',
        cityId: MOCK_CITY_ID,
        categoryId: MOCK_CATEGORY_ID,
        latitude: -23.45,
        longitude: -51.95,
        userId: MOCK_USER_ID,
      });

      expect(result.coordinates).toEqual({ lat: -23.45, lng: -51.95 });
      expect(mockPrisma.client.$executeRaw).toHaveBeenCalled();
    });
  });

  describe('findNearby', () => {
    it('deve retornar locais ordenados por distancia', async () => {
      mockPrisma.client.$queryRaw.mockResolvedValue([
        {
          id: MOCK_LOCAL_ID,
          name: 'UPA Centro',
          description: 'UPA',
          address: 'Rua Flores',
          phone: '3221',
          cityId: MOCK_CITY_ID,
          categoryId: MOCK_CATEGORY_ID,
          userId: MOCK_USER_ID,
          lat: -23.45,
          lng: -51.95,
          distance: 350,
        },
      ]);

      const result = await service.findNearby({
        lat: -23.45,
        lng: -51.95,
        radius: 1000,
      });

      expect(result.items[0].id).toBe(MOCK_LOCAL_ID);
      expect(result.items[0].distance).toBe(350);
      expect(result.items[0].coordinates).toEqual({ lat: -23.45, lng: -51.95 });
    });
  });
});
