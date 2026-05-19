import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
  provideRouter,
} from '@angular/router';

import {
  adminGuard,
  authenticatedGuard,
  superAdminGuard,
  unauthenticatedGuard,
} from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

interface Persona {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const VISITANTE: Persona = { isAuthenticated: false, isAdmin: false, isSuperAdmin: false };
const CIDADAO: Persona = { isAuthenticated: true, isAdmin: false, isSuperAdmin: false };
const ADMIN_MUNICIPAL: Persona = { isAuthenticated: true, isAdmin: true, isSuperAdmin: false };
const SUPER_ADMIN: Persona = { isAuthenticated: true, isAdmin: true, isSuperAdmin: true };

function setup(p: Persona) {
  const auth = {
    isAuthenticated: () => p.isAuthenticated,
    isAdmin: () => p.isAdmin,
    isSuperAdmin: () => p.isSuperAdmin,
    logout: vi.fn(),
  };
  const toast = { show: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: ToastService, useValue: toast },
    ],
  });
  return { auth, toast, router: TestBed.inject(Router) };
}

const ROUTE = {} as ActivatedRouteSnapshot;
const stateOf = (url: string) => ({ url }) as RouterStateSnapshot;

function asPath(router: Router, result: unknown): string {
  return decodeURIComponent(router.serializeUrl(result as UrlTree));
}

describe('authenticatedGuard', () => {
  it('visitante: redireciona para a raiz preservando returnUrl', () => {
    const { router } = setup(VISITANTE);
    const result = TestBed.runInInjectionContext(() =>
      authenticatedGuard(ROUTE, stateOf('/events')),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(asPath(router, result)).toBe('/?returnUrl=/events');
  });

  it('cidadão autenticado: libera (papel é tratado pelo adminGuard)', () => {
    setup(CIDADAO);
    const result = TestBed.runInInjectionContext(() =>
      authenticatedGuard(ROUTE, stateOf('/events')),
    );
    expect(result).toBe(true);
  });

  it('Super Admin: libera', () => {
    setup(SUPER_ADMIN);
    const result = TestBed.runInInjectionContext(() =>
      authenticatedGuard(ROUTE, stateOf('/events')),
    );
    expect(result).toBe(true);
  });
});

describe('adminGuard', () => {
  it('cidadão: toast, logout(forbidden) e redireciona para a raiz', () => {
    const { auth, toast, router } = setup(CIDADAO);
    const result = TestBed.runInInjectionContext(() => adminGuard(ROUTE, stateOf('/posts')));
    expect(toast.show).toHaveBeenCalledWith('error', 'Acesso negado para este papel.');
    expect(auth.logout).toHaveBeenCalledWith('forbidden');
    expect(asPath(router, result)).toBe('/?reason=forbidden');
  });

  it('ADMIN municipal: libera', () => {
    setup(ADMIN_MUNICIPAL);
    const result = TestBed.runInInjectionContext(() => adminGuard(ROUTE, stateOf('/posts')));
    expect(result).toBe(true);
  });

  it('Super Admin: libera', () => {
    setup(SUPER_ADMIN);
    const result = TestBed.runInInjectionContext(() => adminGuard(ROUTE, stateOf('/posts')));
    expect(result).toBe(true);
  });
});

describe('superAdminGuard', () => {
  it('cidadão: toast e redireciona para /dashboard', () => {
    const { toast, router } = setup(CIDADAO);
    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard(ROUTE, stateOf('/admins')),
    );
    expect(toast.show).toHaveBeenCalledWith('error', 'Acesso restrito ao Super Admin.');
    expect(asPath(router, result)).toBe('/dashboard');
  });

  it('ADMIN municipal: bloqueia e redireciona para /dashboard', () => {
    const { router } = setup(ADMIN_MUNICIPAL);
    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard(ROUTE, stateOf('/admins')),
    );
    expect(asPath(router, result)).toBe('/dashboard');
  });

  it('Super Admin: libera', () => {
    setup(SUPER_ADMIN);
    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard(ROUTE, stateOf('/admins')),
    );
    expect(result).toBe(true);
  });
});

describe('unauthenticatedGuard', () => {
  it('visitante: libera o login na raiz', () => {
    setup(VISITANTE);
    const result = TestBed.runInInjectionContext(() =>
      unauthenticatedGuard({} as Route, [] as UrlSegment[]),
    );
    expect(result).toBe(true);
  });

  it('autenticado: nega o match (cai no shell)', () => {
    setup(SUPER_ADMIN);
    const result = TestBed.runInInjectionContext(() =>
      unauthenticatedGuard({} as Route, [] as UrlSegment[]),
    );
    expect(result).toBe(false);
  });
});
