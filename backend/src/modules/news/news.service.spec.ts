import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../config/prisma.service';

import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/request/create-news.dto';

const BASE_DTO = {
  title: 'Título válido',
  description: 'Descrição válida da notícia',
  type: 'saude',
  linkType: 'interno',
  cityId: 'cit_123',
} satisfies CreateNewsDto;

const CITY_ADMIN_USER = {
  sub: 'usr_123',
  role: 'ADMIN',
  cityId: 'cit_jwt',
} as never;

const SUPER_ADMIN_USER = {
  sub: 'usr_super',
  role: 'ADMIN',
  cityId: null,
} as never;

describe('NewsService', () => {
  let service: NewsService;

  const mockPrisma = {
    client: {
      news: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('deve lançar BadRequestException para type inválido', async () => {
    await expect(
      service.create({ ...BASE_DTO, type: 'tipo_invalido' }, SUPER_ADMIN_USER),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar BadRequestException para linkType inválido', async () => {
    await expect(
      service.create({ ...BASE_DTO, linkType: 'link_invalido' }, SUPER_ADMIN_USER),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve usar cityId do JWT para ADMIN', async () => {
    mockPrisma.client.news.create.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      isActive: true,
      cityId: CITY_ADMIN_USER.cityId,
    });

    await service.create(
      { ...BASE_DTO, cityId: 'cit_payload' },
      CITY_ADMIN_USER,
    );

    expect(mockPrisma.client.news.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cityId: CITY_ADMIN_USER.cityId,
        }),
      }),
    );
  });

  it('deve criar uma notícia com sucesso', async () => {
    mockPrisma.client.news.create.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      isActive: true,
    });

    const result = await service.create(BASE_DTO, SUPER_ADMIN_USER);

    expect(result).toHaveProperty('id', 'nws_123');
    expect(mockPrisma.client.news.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: BASE_DTO.title,
          cityId: BASE_DTO.cityId,
        }),
      }),
    );
  });

  it('deve atualizar os campos da notícia', async () => {
    mockPrisma.client.news.findFirst.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      isActive: true,
    });
    mockPrisma.client.news.update.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      title: 'Novo título',
      isActive: true,
    });

    const result = await service.update('nws_123', { title: 'Novo título' }, SUPER_ADMIN_USER);

    expect(result.title).toBe('Novo título');
    expect(mockPrisma.client.news.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'nws_123' },
        data: expect.objectContaining({
          title: 'Novo título',
        }),
      }),
    );
  });

  it('deve fazer soft-delete via isActive = false', async () => {
    mockPrisma.client.news.findFirst.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      isActive: true,
    });

    await service.remove('nws_123', SUPER_ADMIN_USER);

    expect(mockPrisma.client.news.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'nws_123' },
        data: { isActive: false },
      }),
    );
  });

  it('deve lançar NotFoundException quando a notícia não for encontrada', async () => {
    mockPrisma.client.news.findFirst.mockResolvedValue(null);

    await expect(service.findOne('id_inexistente')).rejects.toThrow(NotFoundException);
  });

  it('deve lançar ForbiddenException quando ADMIN tentar modificar notícia de outra cidade', async () => {
    mockPrisma.client.news.findFirst.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      cityId: 'outra_cidade',
      isActive: true,
    });

    await expect(service.update('nws_123', { title: 'T' }, CITY_ADMIN_USER)).rejects.toThrow(ForbiddenException);
    await expect(service.remove('nws_123', CITY_ADMIN_USER)).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar BadRequestException quando Super Admin não informar cityId', async () => {
    await expect(
      service.create(
        { ...BASE_DTO, cityId: undefined },
        SUPER_ADMIN_USER,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

