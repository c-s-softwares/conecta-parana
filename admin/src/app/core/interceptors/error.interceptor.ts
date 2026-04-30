import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const SKIP_PATHS = ['/auth/login', '/auth/refresh'];

let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/**
 * @description
 * Trata falhas HTTP relacionadas à autenticação:
 * - 401 em qualquer requisição autenticada - renova o token e reexecuta a requisição.
 * - 401 em /auth/refresh - força logout.
 * - Qualquer erro em /auth/login ou /auth/refresh - propaga sem alteração para que o serviço trate o erro.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (SKIP_PATHS.some((path) => req.url.includes(path))) {
        return throwError(() => err);
      }

      if (err.status !== 401) {
        return throwError(() => err);
      }

      return handle401(req, next, auth);
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshedToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(replayWithToken(req, token))),
    );
  }

  isRefreshing = true;
  refreshedToken$.next(null);

  return auth.refresh().pipe(
    switchMap((newToken) => {
      isRefreshing = false;
      refreshedToken$.next(newToken);
      return next(replayWithToken(req, newToken));
    }),
    catchError((refreshErr: unknown) => {
      isRefreshing = false;
      refreshedToken$.next(null);
      auth.logout('expired');
      return throwError(() => refreshErr);
    }),
  );
}

function replayWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
