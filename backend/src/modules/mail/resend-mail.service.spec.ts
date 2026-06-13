import { InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

// Template stubs - evita dependência do FS real nos testes.
jest.mock('fs', () => ({
  ...jest.requireActual<object>('fs'),
  readFileSync: jest.fn(() => '<html>{{code}} - {{expiresAt}}</html>'),
}));

import * as Sentry from '@sentry/node';
import { ResendMailService } from './resend-mail.service';

const API_KEY = 're_test_123';
const MAIL_FROM = 'noreply@conectaparana.com';
const RECIPIENT_EMAIL = 'user@example.com';
const CODE = '123456';
const EXPIRES_AT = new Date('2026-06-07T15:00:00.000Z');
const FAKE_MESSAGE_ID = 'msg_abc123';

// Códigos de erro esperados nos asserts.
const ERR_PROVIDER_ERROR = 'mail_provider_error';
const ERR_RATE_LIMITED = 'mail_rate_limited';
const ERR_INVALID_RECIPIENT = 'mail_invalid_recipient';

const RETRY_ATTEMPTS = 3;

// Matcher tipado como unknown para evitar cast de expect.stringContaining (retorna any).
const subjectWithCode: unknown = expect.stringContaining(CODE);

// Parâmetros compartilhados entre os dois métodos testados.
const SEND_PARAMS = {
  email: RECIPIENT_EMAIL,
  code: CODE,
  expiresAt: EXPIRES_AT,
};

const ENV: Record<string, string> = {
  RESEND_API_KEY: API_KEY,
  MAIL_FROM: MAIL_FROM,
};

interface ErrorBody {
  code: string;
}

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof (value as ErrorBody).code === 'string'
  );
}

/** Extrai o campo `code` da resposta de um InternalServerErrorException. */
function getErrorCode(err: InternalServerErrorException): string {
  const body = err.getResponse();
  if (!isErrorBody(body)) {
    throw new Error('Response body sem campo code');
  }
  return body.code;
}

const providerError = (statusCode = 500) => ({
  data: null,
  error: {
    statusCode,
    message: 'Internal Server Error',
    name: 'provider_error',
  },
});

const rateLimitedError = () => ({
  data: null,
  error: {
    statusCode: 429,
    message: 'Rate limit exceeded',
    name: 'rate_limited',
  },
});

const validationError = () => ({
  data: null,
  error: {
    statusCode: 422,
    message: 'Invalid email address',
    name: 'validation_error',
  },
});

const successResponse = () => ({
  data: { id: FAKE_MESSAGE_ID },
  error: null,
});

describe('ResendMailService', () => {
  let service: ResendMailService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResendMailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => ENV[key]),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ResendMailService);
  });

  describe('sendVerificationCode', () => {
    it('envia email e retorna messageId', async () => {
      sendMock.mockResolvedValueOnce(successResponse());

      const result = await service.sendVerificationCode(SEND_PARAMS);

      expect(result).toEqual({ messageId: FAKE_MESSAGE_ID });
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: MAIL_FROM,
          to: RECIPIENT_EMAIL,
          subject: subjectWithCode,
        }),
      );
    });

    it('lança MAIL_PROVIDER_ERROR após retry esgotado em 5xx', async () => {
      sendMock.mockResolvedValue(providerError(500));

      let caught: InternalServerErrorException | undefined;
      try {
        await service.sendVerificationCode(SEND_PARAMS);
      } catch (err) {
        if (err instanceof InternalServerErrorException) caught = err;
      }

      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(getErrorCode(caught!)).toBe(ERR_PROVIDER_ERROR);
      expect(sendMock).toHaveBeenCalledTimes(RETRY_ATTEMPTS);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('lança MAIL_RATE_LIMITED após retry esgotado em 429', async () => {
      sendMock.mockResolvedValue(rateLimitedError());

      let caught: InternalServerErrorException | undefined;
      try {
        await service.sendVerificationCode(SEND_PARAMS);
      } catch (err) {
        if (err instanceof InternalServerErrorException) caught = err;
      }

      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(getErrorCode(caught!)).toBe(ERR_RATE_LIMITED);
      expect(sendMock).toHaveBeenCalledTimes(RETRY_ATTEMPTS);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('lança MAIL_INVALID_RECIPIENT em erro 422 sem retry e sem GlitchTip', async () => {
      sendMock.mockResolvedValueOnce(validationError());

      let caught: InternalServerErrorException | undefined;
      try {
        await service.sendVerificationCode(SEND_PARAMS);
      } catch (err) {
        if (err instanceof InternalServerErrorException) caught = err;
      }

      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(getErrorCode(caught!)).toBe(ERR_INVALID_RECIPIENT);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('retry com sucesso na segunda tentativa após erro transitório', async () => {
      sendMock
        .mockResolvedValueOnce(providerError(503))
        .mockResolvedValueOnce(successResponse());

      const result = await service.sendVerificationCode(SEND_PARAMS);

      expect(result).toEqual({ messageId: FAKE_MESSAGE_ID });
      expect(sendMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendPasswordResetCode', () => {
    it('envia email e retorna messageId', async () => {
      sendMock.mockResolvedValueOnce(successResponse());

      const result = await service.sendPasswordResetCode(SEND_PARAMS);

      expect(result).toEqual({ messageId: FAKE_MESSAGE_ID });
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: MAIL_FROM,
          to: RECIPIENT_EMAIL,
          subject: subjectWithCode,
        }),
      );
    });

    it('lança MAIL_PROVIDER_ERROR após retry esgotado em 5xx', async () => {
      sendMock.mockResolvedValue(providerError(500));

      let caught: InternalServerErrorException | undefined;
      try {
        await service.sendPasswordResetCode(SEND_PARAMS);
      } catch (err) {
        if (err instanceof InternalServerErrorException) caught = err;
      }

      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(getErrorCode(caught!)).toBe(ERR_PROVIDER_ERROR);
      expect(sendMock).toHaveBeenCalledTimes(RETRY_ATTEMPTS);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('lança MAIL_RATE_LIMITED após retry esgotado em 429', async () => {
      sendMock.mockResolvedValue(rateLimitedError());

      let caught: InternalServerErrorException | undefined;
      try {
        await service.sendPasswordResetCode(SEND_PARAMS);
      } catch (err) {
        if (err instanceof InternalServerErrorException) caught = err;
      }

      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(getErrorCode(caught!)).toBe(ERR_RATE_LIMITED);
      expect(sendMock).toHaveBeenCalledTimes(RETRY_ATTEMPTS);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('lança MAIL_INVALID_RECIPIENT em erro 422 sem retry e sem GlitchTip', async () => {
      sendMock.mockResolvedValueOnce(validationError());

      let caught: InternalServerErrorException | undefined;
      try {
        await service.sendPasswordResetCode(SEND_PARAMS);
      } catch (err) {
        if (err instanceof InternalServerErrorException) caught = err;
      }

      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(getErrorCode(caught!)).toBe(ERR_INVALID_RECIPIENT);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
