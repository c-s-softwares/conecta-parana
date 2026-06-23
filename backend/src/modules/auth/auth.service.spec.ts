import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../../config/prisma.service';
import { hash } from 'bcryptjs';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_TOKEN = 'any_token';
const MOCK_PASSWORD = 'senha123';
const MOCK_VALID_TOKEN = 'valid_token';
const MOCK_INVALID_TOKEN = 'invalid_token';
const MOCK_EXPIRED_TOKEN = 'expired_token';

const MOCK_USER = {
  id: `${TABLE_PREFIX.USER}mock_id_00000000000000000`,
  name: 'João',
  email: 'joao@email.com',
  password: 'hashed_password',
  role: 'CIDADAO',
  cityId: null,
};

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
      deleteMany: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock_token'),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('mock_secret'),
};

const mockEmailVerification = {
  sendNewCodeFor: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerification,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const REGISTER_DTO = {
      name: MOCK_USER.name,
      email: MOCK_USER.email,
      password: MOCK_USER.password,
      confirmPassword: MOCK_USER.password,
      cityId: MOCK_CITY_ID,
    };
    const GENERIC_MESSAGE =
      'Cadastro concluído! Verifique seu e-mail para concluir o cadastro.';

    it('cria usuário e dispara código de verificação quando email é novo', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.city.findFirst.mockResolvedValue({ id: MOCK_CITY_ID });
      mockPrisma.client.user.create.mockResolvedValue({
        id: MOCK_USER.id,
        name: MOCK_USER.name,
        email: MOCK_USER.email,
      });

      const result = await service.register(REGISTER_DTO);

      expect(result).toEqual({ message: GENERIC_MESSAGE });
      expect(mockPrisma.client.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.client.user.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ cityId: MOCK_CITY_ID }),
      });
      expect(mockEmailVerification.sendNewCodeFor).toHaveBeenCalledWith({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
      });
    });

    it('retorna mesma mensagem genérica e não cria nem envia código quando email já existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);

      const result = await service.register(REGISTER_DTO);

      expect(result).toEqual({ message: GENERIC_MESSAGE });
      expect(mockPrisma.client.city.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.user.create).not.toHaveBeenCalled();
      expect(mockEmailVerification.sendNewCodeFor).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const LOGIN_DTO = {
      email: MOCK_USER.email,
      password: MOCK_PASSWORD,
    };

    it('deve retornar tokens quando credenciais são válidas e email verificado', async () => {
      const hashed = await hash(MOCK_PASSWORD, 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        password: hashed,
        emailVerifiedAt: new Date(),
      });
      mockPrisma.client.refreshToken.create.mockResolvedValue({});

      const result = await service.login(LOGIN_DTO);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockEmailVerification.sendNewCodeFor).not.toHaveBeenCalled();
    });

    it('dispara código de verificação e lança 401 quando email não verificado', async () => {
      const hashed = await hash(MOCK_PASSWORD, 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        password: hashed,
        emailVerifiedAt: null,
      });

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockEmailVerification.sendNewCodeFor).toHaveBeenCalledWith({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
      });
    });

    it('deve lançar UnauthorizedException se usuário não existir', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockEmailVerification.sendNewCodeFor).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se senha for incorreta', async () => {
      const hashed = await hash('outrasenha', 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        password: hashed,
        emailVerifiedAt: null,
      });

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockEmailVerification.sendNewCodeFor).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('deve retornar novos tokens com refresh token válido', async () => {
      mockPrisma.client.refreshToken.findUnique.mockResolvedValue({
        token: MOCK_VALID_TOKEN,
        expiresAt: new Date(Date.now() + 100000),
        userId: MOCK_USER.id,
      });
      mockPrisma.client.refreshToken.delete.mockResolvedValue({});
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
      });
      mockPrisma.client.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh(MOCK_VALID_TOKEN);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockPrisma.client.refreshToken.delete).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UnauthorizedException se token não existir', async () => {
      mockPrisma.client.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(MOCK_INVALID_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException se token estiver expirado', async () => {
      mockPrisma.client.refreshToken.findUnique.mockResolvedValue({
        token: MOCK_EXPIRED_TOKEN,
        expiresAt: new Date(Date.now() - 100000),
        userId: MOCK_USER.id,
      });

      await expect(service.refresh(MOCK_EXPIRED_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    const MOCK_CITY_NAME = 'Maringá';

    it('retorna dados do usuário com cidade e sem a senha', async () => {
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER.id,
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
        cityId: MOCK_CITY_ID,
        city: { id: MOCK_CITY_ID, name: MOCK_CITY_NAME },
      });

      const result = await service.getMe(MOCK_USER.id);

      expect(result).toEqual({
        id: MOCK_USER.id,
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
        cityId: MOCK_CITY_ID,
        city: MOCK_CITY_NAME,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('retorna city null quando o usuário não tem cidade', async () => {
      mockPrisma.client.user.findUniqueOrThrow.mockResolvedValue({
        id: MOCK_USER.id,
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
        cityId: null,
        city: null,
      });

      const result = await service.getMe(MOCK_USER.id);

      expect(result).toMatchObject({ cityId: null, city: null });
    });
  });
  describe('logout', () => {
    it('deve deletar o refresh token do banco de dados (idempotente)', async () => {
      mockPrisma.client.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.logout(MOCK_TOKEN)).resolves.not.toThrow();

      expect(mockPrisma.client.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: MOCK_TOKEN },
      });
    });
  });

  describe('logoutAll', () => {
    it('deve revogar todos os refresh tokens do usuário quando a senha for válida', async () => {
      const hashed = await hash(MOCK_PASSWORD, 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        password: hashed,
      });
      mockPrisma.client.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await expect(
        service.logoutAll(MOCK_USER.id, { password: MOCK_PASSWORD }),
      ).resolves.not.toThrow();

      expect(mockPrisma.client.user.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_USER.id },
      });
      expect(mockPrisma.client.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER.id },
      });
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      await expect(
        service.logoutAll(MOCK_USER.id, { password: MOCK_PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha estiver incorreta', async () => {
      const hashed = await hash(MOCK_PASSWORD, 10);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        password: hashed,
      });

      await expect(
        service.logoutAll(MOCK_USER.id, { password: 'senha_errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
