import { ConfigService } from '@nestjs/config';
import { IncomingMessage, ServerResponse } from 'http';
import { genReqId, pinoLoggerFactory } from './logger.module';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createMockRes(): ServerResponse {
  return {
    headersSent: false,
    setHeader: jest.fn(),
  } as unknown as ServerResponse;
}

describe('PinoLoggerModule', () => {
  describe('genReqId', () => {
    it('deve retornar o x-request-id quando presente no header', () => {
      const req = {
        headers: { 'x-request-id': 'abc-123' },
      } as unknown as IncomingMessage;
      const res = createMockRes();

      expect(genReqId(req, res)).toBe('abc-123');
    });

    it('deve gerar UUID quando x-request-id não está presente', () => {
      const req = { headers: {} } as unknown as IncomingMessage;
      const res = createMockRes();

      expect(genReqId(req, res)).toMatch(UUID_V4_REGEX);
    });

    it('deve gerar UUID quando x-request-id é string vazia', () => {
      const req = {
        headers: { 'x-request-id': '' },
      } as unknown as IncomingMessage;
      const res = createMockRes();

      expect(genReqId(req, res)).toMatch(UUID_V4_REGEX);
    });

    it('deve gerar UUID quando x-request-id é array', () => {
      const req = {
        headers: { 'x-request-id': ['a', 'b'] },
      } as unknown as IncomingMessage;
      const res = createMockRes();

      expect(genReqId(req, res)).toMatch(UUID_V4_REGEX);
    });

    it('deve setar x-request-id no response header', () => {
      const req = {
        headers: { 'x-request-id': 'test-id-456' },
      } as unknown as IncomingMessage;
      const res = createMockRes();

      genReqId(req, res);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'test-id-456');
    });

    it('não deve setar header quando res não é fornecido', () => {
      const req = { headers: {} } as unknown as IncomingMessage;

      const result = genReqId(req);

      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('não deve setar header quando headers já foram enviados', () => {
      const req = {
        headers: { 'x-request-id': 'abc' },
      } as unknown as IncomingMessage;
      const res = {
        headersSent: true,
        setHeader: jest.fn(),
      } as unknown as ServerResponse;

      genReqId(req, res);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });

  describe('pinoLoggerFactory', () => {
    it('deve usar pino-pretty e level debug em development', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue('development'),
      } as unknown as ConfigService;

      const result = pinoLoggerFactory(mockConfig);

      expect(result.pinoHttp).toHaveProperty('transport');

      const pinoHttp = result.pinoHttp as Record<string, unknown>;
      const transport = pinoHttp['transport'] as { target: string };
      expect(transport.target).toBe('pino-pretty');
      expect(pinoHttp['level']).toBe('debug');
    });

    it('deve usar level info sem transport em production', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue('production'),
      } as unknown as ConfigService;

      const result = pinoLoggerFactory(mockConfig);

      const pinoHttp = result.pinoHttp as Record<string, unknown>;
      expect(pinoHttp['transport']).toBeUndefined();
      expect(pinoHttp['level']).toBe('info');
    });

    it('deve incluir autoLogging como true', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue('production'),
      } as unknown as ConfigService;

      const result = pinoLoggerFactory(mockConfig);

      const pinoHttp = result.pinoHttp as Record<string, unknown>;
      expect(pinoHttp['autoLogging']).toBe(true);
    });

    it('deve incluir genReqId na configuração', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue('production'),
      } as unknown as ConfigService;

      const result = pinoLoggerFactory(mockConfig);

      const pinoHttp = result.pinoHttp as Record<string, unknown>;
      expect(pinoHttp['genReqId']).toBe(genReqId);
    });
  });
});
