import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../config/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { apiError } from '../../common/errors/api-error';
import { SEARCH_ERRORS } from './search.errors';
import { SearchQueryDto } from './dto/search-query.dto';

describe('SearchService', () => {
  let service: SearchService;

  const mockPrisma = {
    client: {
      event: { findMany: jest.fn(), count: jest.fn() },
      communicate: { findMany: jest.fn(), count: jest.fn() },
      news: { findMany: jest.fn(), count: jest.fn() },
      local: { findMany: jest.fn(), count: jest.fn() },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar query_too_short se a busca for muito curta', async () => {
    const dto: SearchQueryDto = { q: ' ab ' };
    await expect(service.search(dto)).rejects.toThrow(
      new BadRequestException(apiError(SEARCH_ERRORS.QUERY_TOO_SHORT)),
    );
  });

  it('deve lançar invalid_types se o type não for conhecido', async () => {
    const dto: SearchQueryDto = { q: 'valida', types: 'events,unknown' };
    await expect(service.search(dto)).rejects.toThrow(
      new BadRequestException(apiError(SEARCH_ERRORS.INVALID_TYPES)),
    );
  });

  it('deve construir o where corretamente e fazer a chamada no Prisma para todos os models default', async () => {
    mockPrisma.client.event.findMany.mockResolvedValue([{ id: '1' }]);
    mockPrisma.client.event.count.mockResolvedValue(1);
    mockPrisma.client.communicate.findMany.mockResolvedValue([]);
    mockPrisma.client.communicate.count.mockResolvedValue(0);
    mockPrisma.client.news.findMany.mockResolvedValue([]);
    mockPrisma.client.news.count.mockResolvedValue(0);
    mockPrisma.client.local.findMany.mockResolvedValue([]);
    mockPrisma.client.local.count.mockResolvedValue(0);

    const dto: SearchQueryDto = { q: 'teste', cityId: 'cit_123' };
    const result = await service.search(dto);

    expect(result).toHaveProperty('events');
    expect(result).toHaveProperty('communicates');
    expect(result).toHaveProperty('news');
    expect(result).toHaveProperty('locals');

    const events = result.events as { items: unknown[]; total: number };
    expect(events.items).toHaveLength(1);

    expect(mockPrisma.client.event.findMany).toHaveBeenCalledWith({
      where: {
        cityId: 'cit_123',
        deletedAt: null,
        OR: [
          { title: { contains: 'teste', mode: 'insensitive' } },
          { description: { contains: 'teste', mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  });

  it('deve filtrar apenas os models especificados em types', async () => {
    mockPrisma.client.news.findMany.mockResolvedValue([{ id: '2' }]);
    mockPrisma.client.news.count.mockResolvedValue(1);

    const dto: SearchQueryDto = { q: 'teste', types: 'news' };
    const result = await service.search(dto);

    expect(result).toHaveProperty('news');
    expect(result).not.toHaveProperty('events');
    expect(result).not.toHaveProperty('communicates');
    expect(result).not.toHaveProperty('locals');

    expect(mockPrisma.client.news.findMany).toHaveBeenCalled();
    expect(mockPrisma.client.event.findMany).not.toHaveBeenCalled();
  });

  it('deve normalizar types com espaços (ex: "events , locals") e efetuar a busca', async () => {
    mockPrisma.client.event.findMany.mockResolvedValue([]);
    mockPrisma.client.event.count.mockResolvedValue(0);
    mockPrisma.client.local.findMany.mockResolvedValue([]);
    mockPrisma.client.local.count.mockResolvedValue(0);

    const dto: SearchQueryDto = { q: 'teste', types: 'events , locals' };
    const result = await service.search(dto);

    expect(result).toHaveProperty('events');
    expect(result).toHaveProperty('locals');
    expect(result).not.toHaveProperty('news');
    expect(result).not.toHaveProperty('communicates');

    expect(mockPrisma.client.event.findMany).toHaveBeenCalled();
    expect(mockPrisma.client.local.findMany).toHaveBeenCalled();
  });

  it('deve deduplicar types com itens repetidos (ex: "news,news") executando a busca apenas uma vez', async () => {
    mockPrisma.client.news.findMany.mockResolvedValue([]);
    mockPrisma.client.news.count.mockResolvedValue(0);

    const dto: SearchQueryDto = { q: 'teste', types: 'news,news' };
    const result = await service.search(dto);

    expect(result).toHaveProperty('news');
    expect(result).not.toHaveProperty('events');

    expect(mockPrisma.client.news.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.client.news.count).toHaveBeenCalledTimes(1);
  });
});
