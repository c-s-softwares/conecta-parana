import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MockMailService } from './mock-mail.service';

const RECIPIENT_EMAIL = 'user@example.com';
const CODE = '123456';
const EXPIRES_AT = new Date('2026-06-07T15:00:00.000Z');

const SEND_PARAMS = {
  email: RECIPIENT_EMAIL,
  code: CODE,
  expiresAt: EXPIRES_AT,
};

describe('MockMailService', () => {
  let service: MockMailService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [MockMailService],
    }).compile();

    service = moduleRef.get(MockMailService);
  });

  describe('sendVerificationCode', () => {
    it('retorna messageId com prefixo mock_', async () => {
      const result = await service.sendVerificationCode(SEND_PARAMS);

      expect(result.messageId).toMatch(/^mock_\d+$/);
    });

    it('armazena a chamada em sentEmails', async () => {
      await service.sendVerificationCode(SEND_PARAMS);

      expect(service.sentEmails).toHaveLength(1);
      expect(service.sentEmails[0]).toEqual(
        expect.objectContaining({
          method: 'sendVerificationCode',
          params: SEND_PARAMS,
        }),
      );
    });
  });

  describe('sendPasswordResetCode', () => {
    it('retorna messageId com prefixo mock_', async () => {
      const result = await service.sendPasswordResetCode(SEND_PARAMS);

      expect(result.messageId).toMatch(/^mock_\d+$/);
    });

    it('armazena a chamada em sentEmails', async () => {
      await service.sendPasswordResetCode(SEND_PARAMS);

      expect(service.sentEmails).toHaveLength(1);
      expect(service.sentEmails[0]).toEqual(
        expect.objectContaining({
          method: 'sendPasswordResetCode',
          params: SEND_PARAMS,
        }),
      );
    });
  });
});
