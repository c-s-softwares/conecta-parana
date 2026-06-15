import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createHash } from 'crypto';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_EMAIL = 'user@email.com';
const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_RECORD_ID = `${TABLE_PREFIX.EMAIL_VERIFICATION_CODE}01HZX3Y4Q9F8TAB1C2DKEYBBBB`;
const MOCK_CODE = '654321';
const MOCK_CODE_HASH = createHash('sha256').update(MOCK_CODE).digest('hex');
const MOCK_RATE_LIMIT_KEY = `resend-verification:${MOCK_EMAIL}`;

const MOCK_UNVERIFIED_USER = {
  id: MOCK_USER_ID,
  email: MOCK_EMAIL,
  emailVerifiedAt: null,
};

const MOCK_VERIFIED_USER = {
  id: MOCK_USER_ID,
  email: MOCK_EMAIL,
  emailVerifiedAt: new Date(),
};

const PENDING_REGISTER = 'cadastro pendente';

const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
};

const mockMail = {
  sendVerificationCode: jest.fn().mockResolvedValue({ messageId: 'mock_id' }),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(0);
    mockPrisma.client.$transaction.mockResolvedValue([]);
  });

  describe('sendNewCodeFor', () => {
    it('invalida códigos pendentes, persiste novo e envia email', async () => {
      await service.sendNewCodeFor({ id: MOCK_USER_ID, email: MOCK_EMAIL });

      expect(
        mockPrisma.client.emailVerificationCode.updateMany,
      ).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, usedAt: null },
        data: { usedAt: expect.any(Date) as unknown as Date },
      });
      expect(
        mockPrisma.client.emailVerificationCode.create,
      ).toHaveBeenCalledTimes(1);
      expect(mockMail.sendVerificationCode).toHaveBeenCalledTimes(1);

      const mailCall = mockMail.sendVerificationCode.mock.calls[0] as [
        { email: string; code: string; expiresAt: Date },
      ];
      const mailArgs = mailCall[0];
      expect(mailArgs.email).toBe(MOCK_EMAIL);
      expect(mailArgs.code).toMatch(/^\d{6}$/);
      expect(mailArgs.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('não propaga erro quando envio falha', async () => {
      mockMail.sendVerificationCode.mockRejectedValueOnce(
        new Error('SMTP down'),
      );

      await expect(
        service.sendNewCodeFor({ id: MOCK_USER_ID, email: MOCK_EMAIL }),
      ).resolves.toBeUndefined();
      expect(
        mockPrisma.client.emailVerificationCode.create,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('verify', () => {
    const VERIFY_DTO = { email: MOCK_EMAIL, code: MOCK_CODE };

    it('marca código usado e atualiza emailVerifiedAt no caminho feliz', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_UNVERIFIED_USER);
      mockPrisma.client.emailVerificationCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });

      const result = await service.verify(VERIFY_DTO);

      expect(result).toEqual({ message: 'Email verificado' });
      expect(mockPrisma.client.$transaction).toHaveBeenCalledTimes(1);
    });

    it('lança invalid_or_expired_code quando user não existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.verify(VERIFY_DTO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código não existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_UNVERIFIED_USER);
      mockPrisma.client.emailVerificationCode.findUnique.mockResolvedValue(
        null,
      );

      await expect(service.verify(VERIFY_DTO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código é de outro user', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_UNVERIFIED_USER);
      mockPrisma.client.emailVerificationCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: 'usr_outro_user_aaaaaaaaaaaaaa',
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });

      await expect(service.verify(VERIFY_DTO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código já foi usado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_UNVERIFIED_USER);
      mockPrisma.client.emailVerificationCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      });

      await expect(service.verify(VERIFY_DTO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança invalid_or_expired_code quando código está expirado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_UNVERIFIED_USER);
      mockPrisma.client.emailVerificationCode.findUnique.mockResolvedValue({
        id: MOCK_RECORD_ID,
        userId: MOCK_USER_ID,
        codeHash: MOCK_CODE_HASH,
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });

      await expect(service.verify(VERIFY_DTO)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resend', () => {
    it('envia novo código quando user existe e não está verificado', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_UNVERIFIED_USER);

      const result = await service.resend({ email: MOCK_EMAIL });

      expect(result.message).toContain(PENDING_REGISTER);
      expect(
        mockPrisma.client.emailVerificationCode.create,
      ).toHaveBeenCalledTimes(1);
      expect(mockMail.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it('não envia código quando user já está verificado, mas mantém resposta genérica', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_VERIFIED_USER);

      const result = await service.resend({ email: MOCK_EMAIL });

      expect(result.message).toContain(PENDING_REGISTER);
      expect(mockMail.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('não envia código quando user não existe, mas mantém resposta genérica', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      const result = await service.resend({ email: MOCK_EMAIL });

      expect(result.message).toContain(PENDING_REGISTER);
      expect(mockMail.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('consome rate limit mesmo para email inexistente', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockCache.get.mockResolvedValue(2);

      await service.resend({ email: MOCK_EMAIL });

      expect(mockCache.set).toHaveBeenCalledWith(
        MOCK_RATE_LIMIT_KEY,
        3,
        expect.any(Number),
      );
    });

    it('lança 429 quando excede o limite', async () => {
      mockCache.get.mockResolvedValue(3);

      await expect(service.resend({ email: MOCK_EMAIL })).rejects.toThrow(
        HttpException,
      );
      expect(mockPrisma.client.user.findUnique).not.toHaveBeenCalled();
      expect(mockMail.sendVerificationCode).not.toHaveBeenCalled();
    });
  });
});
