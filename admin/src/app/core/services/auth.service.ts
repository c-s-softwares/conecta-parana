import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { decodeJwt } from '../../shared/utils/jwt';
import { AuthError, AuthUser, LoginResponse } from './auth.model';

const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const STORAGE_MODE_KEY = 'auth.storage_mode';

type MeResponse = Omit<AuthUser, 'cityId'>;

export type LogoutReason = 'manual' | 'expired' | 'forbidden';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthUser | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  readonly isSuperAdmin = computed(() => {
    const user = this._currentUser();
    return user?.role === 'ADMIN' && user.cityId === null;
  });

  private readonly baseUrl = environment.apiUrl;

  /**
   * @description
   * Realiza o login no backend. Em caso de sucesso: armazena os tokens (localStorage
   * se rememberMe, senão sessionStorage), busca /auth/me e valida a função ADMIN.
   */
  login(email: string, password: string, rememberMe: boolean): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => this.persistTokens(res.access_token, res.refresh_token, rememberMe)),
      switchMap(() => this.loadCurrentUser()),
      tap((user) => {
        if (user.role !== 'ADMIN') {
          this.clearStorage();
          this._currentUser.set(null);
          throw new AuthError('forbidden_role');
        }
      }),
      catchError((err: unknown) => throwError(() => this.mapError(err))),
    );
  }

  /**
   * @description
   * Busca o usuário atual em /auth/me usando o token já armazenado e mescla o
   * `cityId` decodificado do access token (o backend não retorna cityId no /me).
   */
  loadCurrentUser(): Observable<AuthUser> {
    return this.http.get<MeResponse>(`${this.baseUrl}/auth/me`).pipe(
      map((me) => this.buildUser(me)),
      tap((user) => this._currentUser.set(user)),
    );
  }

  /**
   * @description
   * Troca o refresh_token armazenado por um novo par de tokens. Retorna o novo access_token
   * para que o interceptor de erros possa reexecutar a requisição original.
   */
  refresh(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new AuthError('unknown'));
    }
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((res) => {
          const mode = this.readStorageMode();
          this.persistTokens(res.access_token, res.refresh_token, mode === 'local');
        }),
        map((res) => res.access_token),
      );
  }

  /**
   * @description
   * Logout local: limpa o storage, zera o usuário e navega para a raiz.
   */
  logout(reason: LogoutReason = 'manual'): void {
    this.revokeOnServer('/auth/logout');
    this.clearStorage();
    this._currentUser.set(null);
    const extras = reason === 'manual' ? undefined : { queryParams: { reason } };
    this.router.navigate(['/'], extras);
  }

  hasStoredToken(): boolean {
    return this.getAccessToken() !== null;
  }

  getAccessToken(): string | null {
    return this.safeGet(localStorage, ACCESS_TOKEN_KEY) ?? this.safeGet(sessionStorage, ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.safeGet(localStorage, REFRESH_TOKEN_KEY) ?? this.safeGet(sessionStorage, REFRESH_TOKEN_KEY);
  }

  /**
   * @description
   * Atualiza o usuário em memória com os dados vindos do backend.
   */
  setCurrentUser(user: AuthUser | null): void {
    this._currentUser.set(user);
  }

  private buildUser(me: MeResponse): AuthUser {
    const claims = decodeJwt(this.getAccessToken());
    return {
      ...me,
      id: me.id || (claims?.sub ?? ''),
      cityId: claims?.cityId ?? null,
    };
  }

  private revokeOnServer(path: string): void {
    const refreshToken = this.getRefreshToken();
    this.http
      .post(`${this.baseUrl}${path}`, { refresh_token: refreshToken })
      .subscribe({ error: () => undefined });
  }

  private persistTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
    this.clearStorage();
    const primary = rememberMe ? localStorage : sessionStorage;
    if (this.writeTokens(primary, accessToken, refreshToken, rememberMe)) {
      return;
    }
    // Storage primário indisponível (ex: modo anônimo estrito). 
    // Cai para sessionStorage com aviso silencioso; a sessão dura apenas a aba atual.
    console.warn('[auth] storage primário indisponível; usando sessionStorage como fallback.');
    this.writeTokens(sessionStorage, accessToken, refreshToken, false);
  }

  private writeTokens(
    store: Storage,
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean,
  ): boolean {
    try {
      store.setItem(ACCESS_TOKEN_KEY, accessToken);
      store.setItem(REFRESH_TOKEN_KEY, refreshToken);
      store.setItem(STORAGE_MODE_KEY, rememberMe ? 'local' : 'session');
      return true;
    } catch {
      return false;
    }
  }

  private readStorageMode(): 'local' | 'session' {
    return (
      (this.safeGet(localStorage, STORAGE_MODE_KEY) as 'local' | null) ??
      (this.safeGet(sessionStorage, STORAGE_MODE_KEY) as 'session' | null) ??
      'local'
    );
  }

  private clearStorage(): void {
    [localStorage, sessionStorage].forEach((store) => {
      [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, STORAGE_MODE_KEY].forEach((key) => {
        try {
          store.removeItem(key);
        } catch {
          // Storage indisponível, nada acontece.
        }
      });
    });
  }

  private safeGet(store: Storage, key: string): string | null {
    try {
      return store.getItem(key);
    } catch {
      return null;
    }
  }

  private mapError(err: unknown): AuthError {
    if (err instanceof AuthError) return err;
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return new AuthError('server_unreachable');
      if (err.status === 401) return new AuthError('invalid_credentials');
      if (err.status === 429) return new AuthError('too_many_attempts');
    }
    return new AuthError('unknown');
  }
}
