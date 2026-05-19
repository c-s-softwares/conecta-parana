import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { CityScopeGuard, CityScopeOptions } from './city-scope.guard';
import { API_ERROR_CODE } from '../errors/api-error';

type FakeRequest = {
  user?: unknown;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

const mockExecutionContext = (req: FakeRequest): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  }) as unknown as ExecutionContext;

// Roda o guard e devolve a exceção lançada (ou undefined se passou).
const catchThrown = (fn: () => unknown): unknown => {
  try {
    fn();
    return undefined;
  } catch (e) {
    return e;
  }
};

describe('CityScopeGuard', () => {
  let guard: CityScopeGuard;
  let reflector: Reflector;

  const useOptions = (options: CityScopeOptions | undefined): void => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CityScopeGuard(reflector);
  });

  describe('quando não há @RequireCityScope() no endpoint', () => {
    it('deve liberar mesmo sem usuário', () => {
      useOptions(undefined);
      const context = mockExecutionContext({});
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('defensivo: usuário ausente', () => {
    it('deve lançar 401 unauthenticated', () => {
      useOptions({});
      const context = mockExecutionContext({ body: {} });

      const err = catchThrown(() => guard.canActivate(context));

      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({
        code: API_ERROR_CODE.UNAUTHENTICATED,
      });
    });
  });

  describe('persona CIDADAO', () => {
    it('deve liberar (escopo de cidade não se aplica; role é tratada pelo @Roles)', () => {
      useOptions({});
      const context = mockExecutionContext({
        user: { sub: '1', role: Role.CIDADAO, cityId: null },
        body: { cityId: 'cit_MARI' },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('persona Super Admin (ADMIN com cityId null)', () => {
    const superAdmin = { sub: '1', role: Role.ADMIN, cityId: null };

    it('deve lançar 400 city_required quando não informa cityId no payload', () => {
      useOptions({});
      const context = mockExecutionContext({ user: superAdmin, body: {} });

      const err = catchThrown(() => guard.canActivate(context));

      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toMatchObject({
        code: API_ERROR_CODE.CITY_REQUIRED,
      });
    });

    it('deve liberar quando informa a cidade alvo (atua em qualquer cidade)', () => {
      useOptions({});
      const context = mockExecutionContext({
        user: superAdmin,
        body: { cityId: 'cit_MARI' },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve tratar cityId ausente no JWT (undefined) como Super Admin', () => {
      useOptions({});
      const context = mockExecutionContext({
        user: { sub: '1', role: Role.ADMIN },
        body: {},
      });

      const err = catchThrown(() => guard.canActivate(context));
      expect(err).toBeInstanceOf(BadRequestException);
    });
  });

  describe('persona ADMIN municipal (ADMIN com cityId definido)', () => {
    const admin = { sub: '2', role: Role.ADMIN, cityId: 'cit_PAIC' };

    it('deve lançar 403 city_scope_denied ao atuar em outra cidade', () => {
      useOptions({});
      const context = mockExecutionContext({
        user: admin,
        body: { cityId: 'cit_MARI' },
      });

      const err = catchThrown(() => guard.canActivate(context));

      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        code: API_ERROR_CODE.CITY_SCOPE_DENIED,
      });
    });

    it('deve liberar quando a cidade alvo é a própria', () => {
      useOptions({});
      const context = mockExecutionContext({
        user: admin,
        body: { cityId: 'cit_PAIC' },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve liberar quando não há cidade alvo (escopo implícito da própria)', () => {
      useOptions({});
      const context = mockExecutionContext({ user: admin, body: {} });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('opções do decorator', () => {
    const admin = { sub: '2', role: Role.ADMIN, cityId: 'cit_PAIC' };

    it('deve ler de params quando source = params', () => {
      useOptions({ source: 'params' });
      const context = mockExecutionContext({
        user: admin,
        params: { cityId: 'cit_MARI' },
      });

      const err = catchThrown(() => guard.canActivate(context));
      expect(err).toBeInstanceOf(ForbiddenException);
    });

    it('deve ler de um campo customizado quando field é informado', () => {
      useOptions({ field: 'targetCity' });
      const context = mockExecutionContext({
        user: admin,
        body: { targetCity: 'cit_MARI' },
      });

      const err = catchThrown(() => guard.canActivate(context));
      expect(err).toBeInstanceOf(ForbiddenException);
    });
  });
});
