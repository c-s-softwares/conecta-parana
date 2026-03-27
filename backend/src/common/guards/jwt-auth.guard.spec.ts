import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

const makeMockContext = (
  authHeader?: string,
): { context: ExecutionContext; request: Record<string, unknown> } => {
  const request: Record<string, unknown> = {
    headers: { authorization: authHeader },
    user: undefined,
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as jest.Mocked<ConfigService>;

    guard = new JwtAuthGuard(jwtService, configService);
  });

  describe('quando o token é válido', () => {
    it('deve retornar true e injetar o payload no request', async () => {
      const payload = { sub: '1', role: 'ADMIN' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const { context, request } = makeMockContext('Bearer valid-token');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request['user']).toEqual(payload);
    });
  });

  describe('quando o token está ausente', () => {
    it('deve lançar UnauthorizedException sem header Authorization', async () => {
      const { context } = makeMockContext(undefined);
      await expect(() => guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException com header malformado (sem Bearer)', async () => {
      const { context } = makeMockContext('Basic some-token');
      await expect(() => guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('quando o token é inválido ou expirado', () => {
    it('deve lançar UnauthorizedException quando verifyAsync rejeita', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      const { context } = makeMockContext('Bearer expired-token');
      await expect(() => guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('extração do token', () => {
    it('deve chamar verifyAsync com o token e o secret corretos', async () => {
      const payload = { sub: '1', role: 'ADMIN' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const { context } = makeMockContext('Bearer my-token');
      await guard.canActivate(context);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-token', {
        secret: 'test-secret',
      });
    });
  });
});
