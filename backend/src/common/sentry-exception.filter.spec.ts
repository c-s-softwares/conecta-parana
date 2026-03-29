import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { SentryExceptionFilter } from './sentry-exception.filter';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

const mockHost = {
  switchToHttp: jest.fn(),
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
  getType: jest.fn(),
} as unknown as ArgumentsHost;

describe('SentryExceptionFilter', () => {
  let filter: SentryExceptionFilter;
  let superCatchSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    superCatchSpy = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => {});
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    filter = new SentryExceptionFilter(null as never);
    jest.mocked(Sentry.captureException).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reportar ao Sentry com erro 500', () => {
    const exception = new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    filter.catch(exception, mockHost);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
  });

  it('deve reportar ao Sentry com erro 503', () => {
    const exception = new HttpException(
      'Service Unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    filter.catch(exception, mockHost);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
  });

  it('não deve reportar ao Sentry com erro 400', () => {
    const exception = new HttpException(
      'Bad Request',
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockHost);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('não deve reportar ao Sentry com erro 404', () => {
    const exception = new HttpException(
      'Not Found',
      HttpStatus.NOT_FOUND,
    );
    filter.catch(exception, mockHost);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('deve reportar ao Sentry com erro não-HttpException', () => {
    const exception = new Error('crash inesperado');
    filter.catch(exception, mockHost);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
  });

  it('deve sempre chamar super.catch independentemente do tipo de erro', () => {
    const error400 = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const error500 = new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    const errorGeneric = new Error('crash');

    filter.catch(error400, mockHost);
    filter.catch(error500, mockHost);
    filter.catch(errorGeneric, mockHost);

    expect(superCatchSpy).toHaveBeenCalledTimes(3);
    expect(superCatchSpy).toHaveBeenCalledWith(error400, mockHost);
    expect(superCatchSpy).toHaveBeenCalledWith(error500, mockHost);
    expect(superCatchSpy).toHaveBeenCalledWith(errorGeneric, mockHost);
  });

  it('deve logar quando reportar ao Sentry', () => {
    const exception = new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    filter.catch(exception, mockHost);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Exception captured by Sentry/GlitchTip',
    );
  });

  it('não deve logar quando não reportar ao Sentry', () => {
    const exception = new HttpException(
      'Bad Request',
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockHost);

    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });
});
