import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../config/prisma.service';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock_token'),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('mock_secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve criar um usuário com senha hasheada', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.user.create.mockResolvedValue({
        id: 1,
        name: 'João',
        email: 'joao@email.com',
        role: 'USUARIO',
      });

      const result = await service.register({
        name: 'João',
        email: 'joao@email.com',
        password: 'senha123',
      });

      expect(result).toEqual({
        id: 1,
        name: 'João',
        email: 'joao@email.com',
        role: 'USUARIO',
      });
      expect(mockPrisma.client.user.create).toHaveBeenCalledTimes(1);
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'joao@email.com',
      });

      await expect(
        service.register({
          name: 'João',
          email: 'joao@email.com',
          password: 'senha123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('deve retornar tokens quando credenciais são válidas', async () => {
      const hashed = await bcrypt.hash('senha123', 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'joao@email.com',
        password: hashed,
        role: 'USUARIO',
      });
      mockPrisma.client.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'joao@email.com',
        password: 'senha123',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('deve lançar UnauthorizedException se usuário não existir', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'joao@email.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha for incorreta', async () => {
      const hashed = await bcrypt.hash('outrasenha', 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'joao@email.com',
        password: hashed,
        role: 'USUARIO',
      });

      await expect(
        service.login({ email: 'joao@email.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('deve retornar novos tokens com refresh token válido', async () => {
      mockPrisma.client.refreshToken.findUnique.mockResolvedValue({
        token: 'valid_token',
        expiresAt: new Date(Date.now() + 100000),
        userId: 1,
      });
      mockPrisma.client.refreshToken.delete.mockResolvedValue({});
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        email: 'joao@email.com',
        role: 'USUARIO',
      });
      mockPrisma.client.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid_token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockPrisma.client.refreshToken.delete).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UnauthorizedException se token não existir', async () => {
      mockPrisma.client.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException se token estiver expirado', async () => {
      mockPrisma.client.refreshToken.findUnique.mockResolvedValue({
        token: 'expired_token',
        expiresAt: new Date(Date.now() - 100000),
        userId: 1,
      });

      await expect(service.refresh('expired_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    it('deve retornar dados do usuário sem a senha', async () => {
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        name: 'João',
        email: 'joao@email.com',
        role: 'USUARIO',
      });

      const result = await service.getMe(1);

      expect(result).toEqual({
        id: 1,
        name: 'João',
        email: 'joao@email.com',
        role: 'USUARIO',
      });
      expect(result).not.toHaveProperty('password');
    });
  });
});
