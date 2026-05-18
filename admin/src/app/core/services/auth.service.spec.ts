import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { AuthError, AuthUser, JwtClaims } from './auth.model';
import { environment } from '../../../environments/environment';

function makeJwt(payload: Partial<JwtClaims>): string {
  const b64 = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

// /auth/me nao retorna cityId; o service mescla a partir do token.
const meResponse = {
  id: 'usr_super',
  name: 'Admin',
  email: 'admin@conecta.local',
  role: 'ADMIN' as const,
};

const superAdminToken = makeJwt({
  sub: 'usr_super',
  email: 'admin@conecta.local',
  role: 'ADMIN',
  cityId: null,
});

const cityAdminToken = makeJwt({
  sub: 'usr_city',
  email: 'admin@conecta.local',
  role: 'ADMIN',
  cityId: 'cit_maringa',
});

const loginResponse = { access_token: superAdminToken, refresh_token: 'refresh-123' };

const expectedSuperAdmin: AuthUser = {
  id: 'usr_super',
  name: 'Admin',
  email: 'admin@conecta.local',
  role: 'ADMIN',
  cityId: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('armazena tokens no localStorage e mescla cityId do token (rememberMe=true)', () => {
      let result: AuthUser | null = null;
      service.login('admin@x.com', 'secret123', true).subscribe((u) => (result = u));

      http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(meResponse);

      expect(localStorage.getItem('auth.access_token')).toBe(superAdminToken);
      expect(localStorage.getItem('auth.refresh_token')).toBe('refresh-123');
      expect(sessionStorage.getItem('auth.access_token')).toBeNull();
      expect(result).toEqual(expectedSuperAdmin);
      expect(service.currentUser()).toEqual(expectedSuperAdmin);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isAdmin()).toBe(true);
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('armazena tokens no sessionStorage quando rememberMe=false', () => {
      service.login('admin@x.com', 'secret123', false).subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(meResponse);

      expect(sessionStorage.getItem('auth.access_token')).toBe(superAdminToken);
      expect(localStorage.getItem('auth.access_token')).toBeNull();
    });

    it('isSuperAdmin=false para ADMIN municipal (cityId no token)', () => {
      service
        .login('admin@x.com', 'secret123', true)
        .subscribe();
      http
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush({ access_token: cityAdminToken, refresh_token: 'r' });
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(meResponse);

      expect(service.currentUser()?.cityId).toBe('cit_maringa');
      expect(service.isAdmin()).toBe(true);
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('emite invalid_credentials quando backend retorna 401', () => {
      let error: unknown = null;
      service.login('x@x.com', 'bad', true).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      http
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush({ message: 'Credenciais inválidas' }, { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).kind).toBe('invalid_credentials');
    });

    it('emite too_many_attempts quando backend retorna 429', () => {
      let error: unknown = null;
      service.login('x@x.com', 'bad', true).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      http
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush(
          { code: 'too_many_attempts' },
          { status: 429, statusText: 'Too Many Requests' },
        );

      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).kind).toBe('too_many_attempts');
    });

    it('emite server_unreachable quando status=0', () => {
      let error: unknown = null;
      service.login('x@x.com', 'pwd', true).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      http
        .expectOne(`${environment.apiUrl}/auth/login`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect((error as AuthError).kind).toBe('server_unreachable');
    });

    it('emite forbidden_role e limpa storage quando usuário não é ADMIN', () => {
      let error: unknown = null;
      service.login('user@x.com', 'pwd12345', true).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);
      http
        .expectOne(`${environment.apiUrl}/auth/me`)
        .flush({ ...meResponse, role: 'CIDADAO' });

      expect((error as AuthError).kind).toBe('forbidden_role');
      expect(localStorage.getItem('auth.access_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    it('cai para sessionStorage com aviso quando localStorage indisponível', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const originalSetItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key: string,
        value: string,
      ) {
        if (this === localStorage) {
          throw new DOMException('denied');
        }
        originalSetItem.call(this, key, value);
      });

      service.login('admin@x.com', 'secret123', true).subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(meResponse);

      expect(warn).toHaveBeenCalled();
      expect(sessionStorage.getItem('auth.access_token')).toBe(superAdminToken);
      expect(localStorage.getItem('auth.access_token')).toBeNull();
    });
  });

  describe('loadCurrentUser', () => {
    it('popula o signal mesclando cityId do token', () => {
      localStorage.setItem('auth.access_token', cityAdminToken);
      service.loadCurrentUser().subscribe();
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(meResponse);
      expect(service.currentUser()).toEqual({ ...meResponse, cityId: 'cit_maringa' });
    });
  });

  describe('refresh', () => {
    it('retorna novo access_token e atualiza o storage preservando o modo', () => {
      localStorage.setItem('auth.refresh_token', 'old-refresh');
      localStorage.setItem('auth.storage_mode', 'local');

      let newToken: string | null = null;
      service.refresh().subscribe((t) => (newToken = t));

      http
        .expectOne(`${environment.apiUrl}/auth/refresh`)
        .flush({ access_token: 'new-access', refresh_token: 'new-refresh' });

      expect(newToken).toBe('new-access');
      expect(localStorage.getItem('auth.access_token')).toBe('new-access');
      expect(localStorage.getItem('auth.refresh_token')).toBe('new-refresh');
    });

    it('falha imediatamente quando não há refresh_token guardado', () => {
      let error: unknown = null;
      service.refresh().subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });
      expect(error).toBeInstanceOf(AuthError);
    });
  });

  describe('logout', () => {
    it('limpa storage, zera signal, navega para a raiz e revoga no servidor', () => {
      localStorage.setItem('auth.access_token', 'a');
      localStorage.setItem('auth.refresh_token', 'rfk_1');
      service.setCurrentUser(expectedSuperAdmin);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      service.logout('manual');

      const revoke = http.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(revoke.request.body).toEqual({ refresh_token: 'rfk_1' });
      revoke.flush({});

      expect(localStorage.getItem('auth.access_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(navSpy).toHaveBeenCalledWith(['/'], undefined);
    });

    it('não bloqueia o logout local se a revogação no servidor falhar', () => {
      service.setCurrentUser(expectedSuperAdmin);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      service.logout('expired');

      http
        .expectOne(`${environment.apiUrl}/auth/logout`)
        .flush({}, { status: 404, statusText: 'Not Found' });

      expect(service.currentUser()).toBeNull();
      expect(navSpy).toHaveBeenCalledWith(['/'], { queryParams: { reason: 'expired' } });
    });
  });

  describe('token getters', () => {
    it('getAccessToken prioriza localStorage, depois sessionStorage', () => {
      sessionStorage.setItem('auth.access_token', 'from-session');
      expect(service.getAccessToken()).toBe('from-session');
      localStorage.setItem('auth.access_token', 'from-local');
      expect(service.getAccessToken()).toBe('from-local');
    });

    it('hasStoredToken reflete presença em qualquer storage', () => {
      expect(service.hasStoredToken()).toBe(false);
      sessionStorage.setItem('auth.access_token', 'x');
      expect(service.hasStoredToken()).toBe(true);
    });
  });

  describe('mapError (via login)', () => {
    it('mapeia erros desconhecidos para kind=unknown', () => {
      let error: unknown = null;
      service.login('a@b.com', 'pwd12345', true).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });
      http
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush('boom', { status: 500, statusText: 'Internal Server Error' });
      expect((error as AuthError).kind).toBe('unknown');
    });
  });
});
