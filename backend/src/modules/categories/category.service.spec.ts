import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { Prisma } from '@prisma/client';

import { CategoryService } from './category.service';

import { PrismaService } from '../../config/prisma.service';

import { TABLE_PREFIX } from '../../common/types/ulid.types';

import { apiError } from '../../common/errors/api-error';
import { CATEGORY_ERRORS } from './categories.errors';

const MOCK_CATEGORY_ID = `${TABLE_PREFIX.CATEGORY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_CATEGORY = {
  id: MOCK_CATEGORY_ID,
  name: 'Saúde',
  icon: 'medical-cross',
  createdAt: new Date('2026-05-12T10:30:00Z'),
  deletedAt: null,
};

const mockPrisma = {
  client: {
    category: {
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

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de categorias', async () => {
      mockPrisma.client.category.findMany.mockResolvedValue([MOCK_CATEGORY]);

      mockPrisma.client.category.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({
        items: [
          {
            id: MOCK_CATEGORY_ID,
            name: 'Saúde',
            icon: 'medical-cross',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar categoria por ID', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(MOCK_CATEGORY);

      const result = await service.findOne(MOCK_CATEGORY_ID);

      expect(result.id).toBe(MOCK_CATEGORY_ID);
      expect(result.name).toBe('Saúde');
    });

    it('deve lançar NotFoundException se categoria não existir', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('cat_invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar categoria', async () => {
      mockPrisma.client.category.create.mockResolvedValue(MOCK_CATEGORY);

      const result = await service.create({
        name: 'Saúde',
        icon: 'medical-cross',
      });

      expect(result.name).toBe('Saúde');
      expect(result.icon).toBe('medical-cross');
    });

    it('deve lançar BadRequestException se ícone for inválido', async () => {
      await expect(
        service.create({
          name: 'Saúde',
          icon: 'icone-invalido',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException(category_duplicate) se ocorrer P2002', async () => {
      mockPrisma.client.category.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '4.0.0',
        }),
      );

      await expect(
        service.create({
          name: 'Saúde',
          icon: 'medical-cross',
        }),
      ).rejects.toThrow(
        new ConflictException(apiError(CATEGORY_ERRORS.CATEGORY_DUPLICATE)),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar categoria', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(MOCK_CATEGORY);

      mockPrisma.client.category.update.mockResolvedValue({
        ...MOCK_CATEGORY,
        name: 'Educação',
      });

      const result = await service.update(MOCK_CATEGORY_ID, {
        name: 'Educação',
      });

      expect(result.name).toBe('Educação');
    });

    it('deve lançar BadRequestException se ícone for inválido', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(MOCK_CATEGORY);

      await expect(
        service.update(MOCK_CATEGORY_ID, {
          icon: 'icone-invalido',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException(category_duplicate) se ocorrer P2002', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(MOCK_CATEGORY);

      mockPrisma.client.category.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '4.0.0',
        }),
      );

      await expect(
        service.update(MOCK_CATEGORY_ID, {
          name: 'Saúde',
        }),
      ).rejects.toThrow(
        new ConflictException(apiError(CATEGORY_ERRORS.CATEGORY_DUPLICATE)),
      );
    });
  });

  describe('remove', () => {
    it('deve realizar soft-delete', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(MOCK_CATEGORY);

      mockPrisma.client.category.findUnique.mockResolvedValue({
        _count: {
          locals: 0,
        },
      });

      mockPrisma.client.category.update.mockResolvedValue(MOCK_CATEGORY);

      await service.remove(MOCK_CATEGORY_ID);

      expect(mockPrisma.client.category.update).toHaveBeenCalledWith({
        where: { id: MOCK_CATEGORY_ID },
        data: {
          deletedAt: expect.any(Date) as unknown as Date,
        },
      });
    });

    it('deve lançar ConflictException(category_has_locals) se houver locais associados', async () => {
      mockPrisma.client.category.findFirst.mockResolvedValue(MOCK_CATEGORY);

      mockPrisma.client.category.findUnique.mockResolvedValue({
        _count: {
          locals: 1,
        },
      });

      await expect(service.remove(MOCK_CATEGORY_ID)).rejects.toThrow(
        new ConflictException(apiError(CATEGORY_ERRORS.CATEGORY_HAS_LOCALS)),
      );
    });
  });
});
