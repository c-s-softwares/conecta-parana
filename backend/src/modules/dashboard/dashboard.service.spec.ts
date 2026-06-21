import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../config/prisma.service';

const mockPrisma = {
  client: {
    communicate: { count: jest.fn() },
    event: { count: jest.fn() },
    local: { count: jest.fn() },
    notification: { count: jest.fn() },
  },
};

const mockAllZero = () => {
  mockPrisma.client.communicate.count.mockResolvedValue(0);
  mockPrisma.client.event.count.mockResolvedValue(0);
  mockPrisma.client.local.count.mockResolvedValue(0);
  mockPrisma.client.notification.count.mockResolvedValue(0);
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('deve calcular delta e deltaPercent corretamente', async () => {
      mockPrisma.client.communicate.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // thisMonth
        .mockResolvedValueOnce(2); // lastMonth → delta=1, +50%

      mockPrisma.client.event.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(1) // thisMonth
        .mockResolvedValueOnce(2); // lastMonth → delta=-1, -50%

      mockPrisma.client.local.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(4) // thisMonth
        .mockResolvedValueOnce(4); // lastMonth → delta=0, 0%

      mockPrisma.client.notification.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // thisMonth
        .mockResolvedValueOnce(0); // lastMonth=0 → deltaPercent=null

      const result = await service.getMetrics();

      expect(result.communicates).toEqual({
        total: 10,
        thisMonth: 3,
        lastMonth: 2,
        delta: 1,
        deltaPercent: 50,
      });
      expect(result.events).toEqual({
        total: 5,
        thisMonth: 1,
        lastMonth: 2,
        delta: -1,
        deltaPercent: -50,
      });
      expect(result.locals).toEqual({
        total: 20,
        thisMonth: 4,
        lastMonth: 4,
        delta: 0,
        deltaPercent: 0,
      });
      expect(result.notifications).toEqual({
        total: 100,
        thisMonth: 10,
        lastMonth: 0,
        delta: 10,
        deltaPercent: null,
      });
    });

    it('deve retornar deltaPercent: 0 quando ambos os meses têm zero registros', async () => {
      mockAllZero();

      const result = await service.getMetrics();

      expect(result.communicates.deltaPercent).toBe(0);
    });

    it('deve executar exatamente 3 queries por entidade (total, thisMonth, lastMonth)', async () => {
      mockAllZero();

      await service.getMetrics();

      expect(mockPrisma.client.communicate.count).toHaveBeenCalledTimes(3);
      expect(mockPrisma.client.event.count).toHaveBeenCalledTimes(3);
      expect(mockPrisma.client.local.count).toHaveBeenCalledTimes(3);
      expect(mockPrisma.client.notification.count).toHaveBeenCalledTimes(3);
    });

    it('deve filtrar todas as queries de events por isActive: true (mesmo padrão de News e Communicate)', async () => {
      mockAllZero();

      await service.getMetrics();

      const calls = mockPrisma.client.event.count.mock.calls as Array<
        [{ where: { isActive?: boolean } }]
      >;
      expect(calls.every((args) => args[0].where.isActive === true)).toBe(true);
    });
  });
});
