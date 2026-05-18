import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CidadesService } from './cidades.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_CITY = {
  id: MOCK_CITY_ID,
  name: 'Paiçandu',
  state: 'PR',
  createdAt: new Date('2026-05-12T10:30:00Z'),
};

const mockPrisma = {
  client: {
    city: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
};

describe('CidadesService', () => {
  let service: CidadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CidadesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CidadesService>(CidadesService);
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
            nome: 'Paiçandu',
            estado: 'PR',
            createdAt: MOCK_CITY.createdAt,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it('deve usar defaults quando page/pageSize não são informados', async () => {
      mockPrisma.client.city.findMany.mockResolvedValue([]);
      mockPrisma.client.city.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(mockPrisma.client.city.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar cidade por ID', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);

      const result = await service.findOne(MOCK_CITY_ID);

      expect(result.id).toBe(MOCK_CITY_ID);
      expect(result.nome).toBe('Paiçandu');
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
        nome: 'Paiçandu',
        estado: 'PR',
      });

      expect(result.nome).toBe('Paiçandu');
      expect(result.estado).toBe('PR');
      expect(mockPrisma.client.city.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('deve atualizar cidade', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.city.update.mockResolvedValue({
        ...MOCK_CITY,
        name: 'Maringá',
      });

      const result = await service.update(MOCK_CITY_ID, { nome: 'Maringá' });

      expect(result.nome).toBe('Maringá');
    });

    it('deve lançar NotFoundException se cidade não existir', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(
        service.update('cit_invalid', { nome: 'Maringá' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover a cidade fisicamente', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.city.delete.mockResolvedValue(MOCK_CITY);

      await service.remove(MOCK_CITY_ID);

      expect(mockPrisma.client.city.delete).toHaveBeenCalledWith({
        where: { id: MOCK_CITY_ID },
      });
    });

    it('deve lançar NotFoundException se cidade não existir', async () => {
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(service.remove('cit_invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
