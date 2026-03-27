import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

const mockExecutionContext = (user: unknown): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  describe('quando não há @Roles() no endpoint', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    });

    it('deve permitir acesso (rota pública)', () => {
      const context = mockExecutionContext({ role: Role.USUARIO });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve permitir acesso mesmo sem usuário autenticado', () => {
      const context = mockExecutionContext(undefined);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('quando endpoint requer role ADMIN', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    });

    it('deve permitir acesso para usuário com role ADMIN', () => {
      const context = mockExecutionContext({ sub: '1', role: Role.ADMIN });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve lançar ForbiddenException para usuário com role USUARIO', () => {
      const context = mockExecutionContext({ sub: '2', role: Role.USUARIO });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException quando user é undefined', () => {
      const context = mockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException quando user não tem role', () => {
      const context = mockExecutionContext({ sub: '3' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('deve usar ROLES_KEY para buscar metadata', () => {
      const spy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN]);
      const context = mockExecutionContext({ sub: '1', role: Role.ADMIN });

      guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('quando endpoint aceita múltiplas roles', () => {
    beforeEach(() => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.USUARIO]);
    });

    it('deve permitir acesso para ADMIN', () => {
      const context = mockExecutionContext({ sub: '1', role: Role.ADMIN });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve permitir acesso para USUARIO', () => {
      const context = mockExecutionContext({ sub: '2', role: Role.USUARIO });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('mensagem de erro', () => {
    it('deve incluir a role requerida na mensagem de ForbiddenException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = mockExecutionContext({ sub: '2', role: Role.USUARIO });

      try {
        guard.canActivate(context);
        fail('Deveria ter lançado ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).message).toContain('ADMIN');
      }
    });
  });
});
