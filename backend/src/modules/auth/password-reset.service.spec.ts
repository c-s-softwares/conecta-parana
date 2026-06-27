import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createHash } from 'crypto';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_EMAIL = 'user@email.com';
const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_RECORD_ID = `${TABLE_PREFIX.PASSWORD_RESET_CODE}01HZX3Y4Q9F8TAB1C2DKEYAAAA`;
const MOCK_CODE = '123456';
const MOCK_CODE_HASH = createHash('sha256').update(MOCK_CODE).digest('hex');
const MOCK_STRONG_PASSWORD = 'NovaSenha1';
const MOCK_WEAK_PASSWORD = 'fraca';
const MOCK_USER = {
  id: MOCK_USER_ID,
  email: MOCK_EMAIL,
  password: 'old_hash',
  emailVerifiedAt: new Date(),
};
const MOCK_RATE_LIMIT_KEY = `forgot-password:${MOCK_EMAIL}`;

const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
};

const mockMail = {
  sendPasswordResetCode: jest.fn().mockResolvedValue({ messageId: 'mock_id' }),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockEmailVerification = {
  sendNewCodeFor: jest.fn().mockResolvedValue(undefined),
};

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerification,
        },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(0);
    mockPrisma.client.$transaction.mockResolvedValue([]);
  });

  describe('forgotPassword', () => {
    it('gera código, invalida pendentes e envia email quando usuário existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);

      const result = await service.forgotPassword({ email: MOCK_EMAIL });

      expect(result).toEqual({
        message: 'Se o email existir, código enviado',
      });
      expect(
        mockPrisma.client.passwordResetCode.updateMany,
      ).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, usedAt: null },
        data: { usedAt: expect.any(Date) as unknown as Date },
      });
      expect(mockPrisma.client.passwordResetCode.create).toHaveBeenCalledTimes(
        1,
      );
      expect(mockMail.sendPasswordResetCode).toHaveBeenCalledTimes(1);
      const mailCall = mockMail.sendPasswordResetCode.mock.calls[0] as [
        { email: string; code: string; expiresAt: Date },
      ];
      const mailArgs = mailCall[0];
      expect(mailArgs.email).toBe(MOCK_EMAIL);
      expect(mailArgs.code).toMatch(/^\d{6}$/);
      expect(mailArgs.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('retorna mensagem genérica e não envia email quando usuário não existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: MOCK_EMAIL });

      expect(result).toEqual({
        message: 'Se o email existir, código enviado',
      });
      expect(mockMail.sendPasswordResetCode).not.toHaveBeenCalled();
      expect(mockPrisma.client.passwordResetCode.create).not.toHaveBeenCalled();
    });

    it('consome o rate limit mesmo quando o email não existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockCache.get.mockResolvedValue(2);

      await service.forgotPassword({ email: MOCK_EMAIL });

      expect(mockCache.set).toHaveBeenCalledWith(
        MOCK_RATE_LIMIT_KEY,
        3,
        expect.any(Number),
      );
    });

    it('lança 429 quando excede o limite de tentativas', async () => {
      mockCache.get.mockResolvedValue(3);

      await expect(
        service.forgotPassword({ email: MOCK_EMAIL }),
      ).rejects.toThrow(HttpException);
      expect(mockPrisma.client.user.findUnique).not.toHaveBeenCalled();
      expect(mockMail.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('dispara código de verificação ao invés de reset quando user não verificado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        emailVerifiedAt: null,
      });

      await expect(
        service.forgotPassword({ email: MOCK_EMAIL }),
      ).rejects.toThrow(BadRequestException);
      expect(mockEmailVerification.sendNewCodeFor).toHaveBeenCalledWith({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
      });
      expect(mockMail.sendPasswordResetCode).not.toHaveBeenCalled();
      expect(mockPrisma.client.passwordResetCode.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const baseDto = {
      email: MOCK_EMAIL,
      code: MOCK_CODE,
      newPassword: MOCK_STRONG_PASSWORD,
    };

    it('caminho feliz: marca código usado, atualiza senha e revoga refresh tokens', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });

      const result = await service.resetPassword(baseDto);

      expect(result).toEqual({ message: 'Senha alterada' });
      expect(mockPrisma.client.$transaction).toHaveBeenCalledTimes(1);
    });

    it('lança weak_password antes de buscar o usuário', async () => {
      await expect(
        service.resetPassword({ ...baseDto, newPassword: MOCK_WEAK_PASSWORD }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.client.user.findUnique).not.toHaveBeenCalled();
    });

    it('lança invalid_or_expired_code quando user não existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código não casa', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código é de outro user', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: 'usr_outro_user_aaaaaaaaaaaaaa',
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });

      await expect(service.resetPassword(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código já foi usado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      });

      await expect(service.resetPassword(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código está expirado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });

      await expect(service.resetPassword(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyResetCode', () => {
    const baseDto = { email: MOCK_EMAIL, code: MOCK_CODE };

    it('retorna válido sem consumir o código quando ele é válido', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });

      const result = await service.verifyResetCode(baseDto);

      expect(result).toEqual({ message: 'Código válido' });
      expect(mockPrisma.client.passwordResetCode.update).not.toHaveBeenCalled();
      expect(mockPrisma.client.$transaction).not.toHaveBeenCalled();
    });

    it('lança invalid_or_expired_code quando o código não casa', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.passwordResetCode.findUnique.mockResolvedValue(null);

      await expect(service.verifyResetCode(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
