/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../config/prisma.service';

import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/request/create-news.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

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
} as unknown as JwtPayload;

const SUPER_ADMIN_USER = {
  sub: 'usr_super',
  role: 'ADMIN',
  cityId: null,
} as unknown as JwtPayload;

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
      like: {
        findFirst: jest.fn(),
      },
      save: {
        findFirst: jest.fn(),
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
      service.create(
        { ...BASE_DTO, linkType: 'link_invalido' },
        SUPER_ADMIN_USER,
      ),
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

    const result = await service.update(
      'nws_123',
      { title: 'Novo título' },
      SUPER_ADMIN_USER,
    );

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

    await expect(service.findOne('id_inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve lançar ForbiddenException quando ADMIN tentar modificar notícia de outra cidade', async () => {
    mockPrisma.client.news.findFirst.mockResolvedValue({
      id: 'nws_123',
      ...BASE_DTO,
      cityId: 'outra_cidade',
      isActive: true,
    });

    await expect(
      service.update('nws_123', { title: 'T' }, CITY_ADMIN_USER),
    ).rejects.toThrow(ForbiddenException);
    await expect(service.remove('nws_123', CITY_ADMIN_USER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deve lançar BadRequestException quando Super Admin não informar cityId', async () => {
    await expect(
      service.create({ ...BASE_DTO, cityId: undefined }, SUPER_ADMIN_USER),
    ).rejects.toThrow(BadRequestException);
  });

  describe('linkUrl', () => {
    it('persiste linkUrl quando linkType=externo', async () => {
      mockPrisma.client.news.create.mockResolvedValue({
        id: 'nws_123',
        ...BASE_DTO,
        isActive: true,
      });

      await service.create(
        {
          ...BASE_DTO,
          linkType: 'externo',
          linkUrl: 'https://exemplo.com/x',
        },
        SUPER_ADMIN_USER,
      );

      expect(mockPrisma.client.news.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            linkType: 'externo',
            linkUrl: 'https://exemplo.com/x',
          }),
        }),
      );
    });

    it('ignora linkUrl quando linkType=interno (persiste null)', async () => {
      mockPrisma.client.news.create.mockResolvedValue({
        id: 'nws_123',
        ...BASE_DTO,
        isActive: true,
      });

      await service.create(
        {
          ...BASE_DTO,
          linkType: 'interno',
          linkUrl: 'https://nao-deve-persistir.com',
        },
        SUPER_ADMIN_USER,
      );

      expect(mockPrisma.client.news.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            linkType: 'interno',
            linkUrl: null,
          }),
        }),
      );
    });
  });

  describe('findOneDetail', () => {
    const NEWS_ID = 'nws_detail';
    const USER_ID = 'usr_detail';

    const buildNewsRow = (overrides: Record<string, unknown> = {}) => ({
      id: NEWS_ID,
      title: 'Notícia',
      description: 'Descrição da notícia',
      type: 'saude',
      linkType: 'interno',
      linkUrl: null,
      isActive: true,
      cityId: 'cit_x',
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      photos: [],
      _count: { likes: 0 },
      ...overrides,
    });

    it('anônimo: retorna liked=false e saved=false sem queries extras', async () => {
      mockPrisma.client.news.findFirst.mockResolvedValue(
        buildNewsRow({
          photos: [
            {
              id: 'pho_1',
              url: 'https://obj/o/pho_1.webp',
              thumbUrl: 'https://obj/o/pho_1-thumb.webp',
            },
          ],
          _count: { likes: 12 },
        }),
      );

      const result = await service.findOneDetail(NEWS_ID);

      expect(result.likesCount).toBe(12);
      expect(result.liked).toBe(false);
      expect(result.saved).toBe(false);
      expect(result.photos).toHaveLength(1);
      expect(result.photos[0]).toMatchObject({
        id: 'pho_1',
        entityType: 'news',
        entityId: NEWS_ID,
      });
      expect(mockPrisma.client.like.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.save.findFirst).not.toHaveBeenCalled();
    });

    it('logado com like e save: retorna ambos true', async () => {
      mockPrisma.client.news.findFirst.mockResolvedValue(buildNewsRow());
      mockPrisma.client.like.findFirst.mockResolvedValue({ id: 'lke_1' });
      mockPrisma.client.save.findFirst.mockResolvedValue({ id: 'sav_1' });

      const result = await service.findOneDetail(NEWS_ID, USER_ID);

      expect(result.liked).toBe(true);
      expect(result.saved).toBe(true);
      expect(mockPrisma.client.like.findFirst).toHaveBeenCalledWith({
        where: { userId: USER_ID, newsId: NEWS_ID },
        select: { id: true },
      });
      expect(mockPrisma.client.save.findFirst).toHaveBeenCalledWith({
        where: { userId: USER_ID, newsId: NEWS_ID },
        select: { id: true },
      });
    });

    it('logado sem like nem save: retorna ambos false', async () => {
      mockPrisma.client.news.findFirst.mockResolvedValue(buildNewsRow());
      mockPrisma.client.like.findFirst.mockResolvedValue(null);
      mockPrisma.client.save.findFirst.mockResolvedValue(null);

      const result = await service.findOneDetail(NEWS_ID, USER_ID);

      expect(result.liked).toBe(false);
      expect(result.saved).toBe(false);
    });

    it('lança NotFoundException quando a notícia não existe ou está inativa', async () => {
      mockPrisma.client.news.findFirst.mockResolvedValue(null);

      await expect(service.findOneDetail(NEWS_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
