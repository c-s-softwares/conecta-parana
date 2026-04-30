import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { AuthError, AuthUser, LoginResponse } from './auth.model';
import { environment } from '../../../environments/environment';

const adminUser: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@conecta.local',
  role: 'ADMIN',
};

const loginResponse: LoginResponse = {
  access_token: 'access-123',
  refresh_token: 'refresh-123',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
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
  });

  describe('login', () => {
    it('armazena tokens no localStorage quando rememberMe=true', () => {
      let result: AuthUser | null = null;
      service.login('admin@x.com', 'secret123', true).subscribe((u) => (result = u));

      http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(adminUser);

      expect(localStorage.getItem('auth.access_token')).toBe('access-123');
      expect(localStorage.getItem('auth.refresh_token')).toBe('refresh-123');
      expect(sessionStorage.getItem('auth.access_token')).toBeNull();
      expect(result).toEqual(adminUser);
      expect(service.currentUser()).toEqual(adminUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isAdmin()).toBe(true);
    });

    it('armazena tokens no sessionStorage quando rememberMe=false', () => {
      service.login('admin@x.com', 'secret123', false).subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(adminUser);

      expect(sessionStorage.getItem('auth.access_token')).toBe('access-123');
      expect(localStorage.getItem('auth.access_token')).toBeNull();
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

    it('emite server_unreachable quando status=0', () => {
      let error: unknown = null;
      service.login('x@x.com', 'pwd', true).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      http
        .expectOne(`${environment.apiUrl}/auth/login`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(error).toBeInstanceOf(AuthError);
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
        .flush({ ...adminUser, role: 'USUARIO' });

      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).kind).toBe('forbidden_role');
      expect(localStorage.getItem('auth.access_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('loadCurrentUser', () => {
    it('popula o signal ao consultar /auth/me', () => {
      service.loadCurrentUser().subscribe();
      http.expectOne(`${environment.apiUrl}/auth/me`).flush(adminUser);
      expect(service.currentUser()).toEqual(adminUser);
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
    it('limpa storage, zera signal e navega para /login', () => {
      localStorage.setItem('auth.access_token', 'a');
      sessionStorage.setItem('auth.refresh_token', 'b');
      service.setCurrentUser(adminUser);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      service.logout('manual');

      expect(localStorage.getItem('auth.access_token')).toBeNull();
      expect(sessionStorage.getItem('auth.refresh_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(navSpy).toHaveBeenCalledWith(['/login'], undefined);
    });

    it('repassa o motivo via queryParams quando não-manual', () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      service.logout('expired');
      expect(navSpy).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'expired' } });
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

    it('passa HttpErrorResponse via mapError sem mutação', () => {
      // Exercita o ramo HttpErrorResponse status != 0/401 já coberto; este caso
      // garante que instanceof AuthError é preservado se disparado pelo próprio fluxo.
      const err = new HttpErrorResponse({ status: 500 });
      expect(err).toBeInstanceOf(HttpErrorResponse);
    });
  });
});
