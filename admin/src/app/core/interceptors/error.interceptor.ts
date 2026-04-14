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

// Shared state for coordinating concurrent 401s during a single refresh cycle.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/**
 * Handles auth-related HTTP failures:
 * - 401 on any authenticated request → try one refresh, replay the request.
 * - 401 on /auth/refresh → force logout.
 * - Any error on /auth/login or /auth/refresh → propagate untouched so the
 *   calling service maps it to a user-facing AuthError.
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
    // Queue this request until the in-flight refresh resolves.
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
