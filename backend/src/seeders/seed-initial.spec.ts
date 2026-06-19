import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { runSeed } from './seed-initial';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const EMPTY_COUNT = 0;
const HAS_DATA_COUNT = 1;

const mockTx = {
  city: { createMany: jest.fn(), deleteMany: jest.fn() },
  category: { createMany: jest.fn(), deleteMany: jest.fn() },
  user: { createMany: jest.fn(), deleteMany: jest.fn() },
  local: { create: jest.fn(), deleteMany: jest.fn() },
  event: { createMany: jest.fn(), deleteMany: jest.fn() },
  communicate: { createMany: jest.fn(), deleteMany: jest.fn() },
  news: { createMany: jest.fn(), deleteMany: jest.fn() },
  photo: { deleteMany: jest.fn() },
  like: { deleteMany: jest.fn() },
  save: { deleteMany: jest.fn() },
  notification: { deleteMany: jest.fn() },
  $executeRaw: jest.fn(),
};

const mockCityCount = jest.fn();
const mockUserCount = jest.fn();
const mockTransaction = jest
  .fn()
  .mockImplementation(async (fn: (tx: typeof mockTx) => Promise<void>) =>
    fn(mockTx),
  );

const mockPrisma = {
  city: { count: mockCityCount },
  user: { count: mockUserCount },
  $transaction: mockTransaction,
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

beforeAll(() => {
  jest.spyOn(Logger.prototype, 'error').mockImplementation();
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NODE_ENV = 'test';
  mockTransaction.mockImplementation(
    async (fn: (tx: typeof mockTx) => Promise<void>) => fn(mockTx),
  );
});

afterAll(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe('runSeed', () => {
  it('popula banco vazio sem --force', async () => {
    mockCityCount.mockResolvedValue(EMPTY_COUNT);
    mockUserCount.mockResolvedValue(EMPTY_COUNT);

    await runSeed(mockPrisma, { force: false });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTx.city.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.category.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.user.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.local.create).toHaveBeenCalledTimes(10);
    expect(mockTx.event.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.communicate.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.news.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.city.deleteMany).not.toHaveBeenCalled();
  });

  it('lanca seed_data_present quando banco tem dados e force=false', async () => {
    mockCityCount.mockResolvedValue(HAS_DATA_COUNT);
    mockUserCount.mockResolvedValue(HAS_DATA_COUNT);

    await expect(runSeed(mockPrisma, { force: false })).rejects.toThrow(
      'seed_data_present',
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('apaga e repopula quando banco tem dados e force=true', async () => {
    mockCityCount.mockResolvedValue(HAS_DATA_COUNT);
    mockUserCount.mockResolvedValue(HAS_DATA_COUNT);

    await runSeed(mockPrisma, { force: true });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTx.photo.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.like.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.save.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.notification.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.event.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.communicate.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.news.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.local.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.category.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.user.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.city.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockTx.city.createMany).toHaveBeenCalledTimes(1);
    expect(mockTx.local.create).toHaveBeenCalledTimes(10);
  });

  it('lanca seed_disallowed_in_production quando NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';

    await expect(runSeed(mockPrisma, { force: false })).rejects.toThrow(
      'seed_disallowed_in_production',
    );
    expect(mockCityCount).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('propaga erro quando a transacao falha', async () => {
    mockCityCount.mockResolvedValue(EMPTY_COUNT);
    mockUserCount.mockResolvedValue(EMPTY_COUNT);
    mockTransaction.mockRejectedValue(new Error('connection lost'));

    await expect(runSeed(mockPrisma, { force: false })).rejects.toThrow(
      'connection lost',
    );
  });
});
