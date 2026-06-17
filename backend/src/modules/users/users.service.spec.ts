import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { USERS_ERRORS } from './users.errors';
import { CITY_UPDATE_THROTTLE_SECONDS } from './users.constants';

const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9US`;
const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MA`;
const MOCK_CITY_ID_2 = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9PA`;

const mockPrisma = {
  client: {
    user: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('updateUserCity', () => {
    it('deve atualizar a cidade com sucesso quando lastCityUpdateAt é null (primeira chamada)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-16T12:00:00.000Z'));
      const now = new Date();
      const mockUser = {
        id: MOCK_USER_ID,
        cityId: null,
        lastCityUpdateAt: null,
      };

      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrisma.client.city.findFirst.mockResolvedValue({
        id: MOCK_CITY_ID,
        deletedAt: null,
      });
      mockPrisma.client.user.update.mockResolvedValue({
        id: MOCK_USER_ID,
        cityId: MOCK_CITY_ID,
        lastCityUpdateAt: now,
      });

      const result = await service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID);

      expect(result.id).toBe(MOCK_USER_ID);
      expect(result.cityId).toBe(MOCK_CITY_ID);
      expect(result.lastCityUpdateAt).toBe(now);

      expect(mockPrisma.client.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: MOCK_USER_ID },
      });
      expect(mockPrisma.client.city.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_CITY_ID, deletedAt: null },
      });
      expect(mockPrisma.client.user.update).toHaveBeenCalledWith({
        where: { id: MOCK_USER_ID },
        data: { city: { connect: { id: MOCK_CITY_ID } }, lastCityUpdateAt: now },
        select: { id: true, cityId: true, lastCityUpdateAt: true },
      });
      jest.useRealTimers();
    });

    it('deve retornar a cidade atual (idempotência) sem atualizar se for a mesma cidade', async () => {
      const pastDate = new Date();
      const mockUser = {
        id: MOCK_USER_ID,
        cityId: MOCK_CITY_ID,
        lastCityUpdateAt: pastDate,
      };

      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID);

      expect(result.id).toBe(MOCK_USER_ID);
      expect(result.cityId).toBe(MOCK_CITY_ID);
      expect(result.lastCityUpdateAt).toBe(pastDate);

      expect(mockPrisma.client.city.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.user.update).not.toHaveBeenCalled();
    });

    it('deve atualizar com sucesso quando lastCityUpdateAt excede a janela de throttle', async () => {
      const pastDate = new Date(
        Date.now() - (CITY_UPDATE_THROTTLE_SECONDS + 5) * 1000,
      );
      const mockUser = {
        id: MOCK_USER_ID,
        cityId: MOCK_CITY_ID,
        lastCityUpdateAt: pastDate,
      };

      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrisma.client.city.findFirst.mockResolvedValue({
        id: MOCK_CITY_ID_2,
        deletedAt: null,
      });
      mockPrisma.client.user.update.mockResolvedValue({
        id: MOCK_USER_ID,
        cityId: MOCK_CITY_ID_2,
        lastCityUpdateAt: new Date(),
      });

      const result = await service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID_2);

      expect(result.cityId).toBe(MOCK_CITY_ID_2);
      expect(mockPrisma.client.user.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando a cidade não existe', async () => {
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER_ID,
        cityId: null,
        lastCityUpdateAt: null,
      });
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(
        service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando a cidade está deletada', async () => {
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER_ID,
        cityId: null,
        lastCityUpdateAt: null,
      });
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(
        service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.city.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_CITY_ID, deletedAt: null },
      });
      expect(mockPrisma.client.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar HttpException 429 quando a última atualização foi dentro da janela de throttle', async () => {
      const recentDate = new Date(
        Date.now() - (CITY_UPDATE_THROTTLE_SECONDS / 2) * 1000,
      );
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER_ID,
        cityId: MOCK_CITY_ID,
        lastCityUpdateAt: recentDate,
      });

      try {
        await service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID_2);
        fail('Deveria ter lançado HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );
        const body = (error as HttpException).getResponse();
        expect(body).toEqual({
          code: USERS_ERRORS.UPDATE_TOO_FREQUENT,
          message:
            'Cidade já foi atualizada há menos de 60 segundos. Tente novamente em instantes.',
        });
      }

      expect(mockPrisma.client.city.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar HttpException 429 no limite exato da janela', async () => {
      const justUnder = new Date(
        Date.now() - (CITY_UPDATE_THROTTLE_SECONDS - 1) * 1000,
      );
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER_ID,
        cityId: MOCK_CITY_ID,
        lastCityUpdateAt: justUnder,
      });

      await expect(
        service.updateUserCity(MOCK_USER_ID, MOCK_CITY_ID_2),
      ).rejects.toThrow(HttpException);

      expect(mockPrisma.client.user.update).not.toHaveBeenCalled();
    });
  });
});
