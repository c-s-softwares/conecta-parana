import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { AppError } from './app-error';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const SKIP_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/verify-reset-code',
  '/auth/reset-password',
];

// ---------------------------------------------------------------------------
// ERROR_CODE_MAP — mapeamento primário por code field.
//
// Semântica dos valores:
//   string  → toast com essa mensagem PT-BR fixa
//   null    → toast com a mensagem que vier do backend (err.error.message)
//   false   → passthrough silencioso: sem toast, AppError repassado ao componente
//
// ---------------------------------------------------------------------------
export const ERROR_CODE_MAP: Record<string, string | null | false> = {
  'validation_failed': false, // sem toast — componente destaca campos inválidos no form
  'too_many_attempts': null,  // toast com mensagem do backend (já vem clara)

  'city_scope_denied': 'Você só pode atuar na sua cidade.',
  'event_changed': 'Outro usuário editou este evento. Recarregue a página.',
  'event_date_in_past': false, // inline no campo eventDate
  'invalid_event_type': false, // inline no select de tipo
  'file_too_large': 'Arquivo muito grande (máx 5MB).',
  'invalid_file_type': 'Use JPEG, PNG ou WebP.',
  'photo_limit_reached': 'Limite de 10 fotos por evento atingido.',
  'storage_unavailable':
    'Serviço de imagens indisponível. Tente novamente em instantes.',
};

// ---------------------------------------------------------------------------
// STATUS_MAP — fallback por HTTP status quando nenhum code field presente.
// Usado para erros que ainda não têm code padronizado no backend.
//
//   string → toast com essa mensagem PT-BR fixa
//   null   → toast com a mensagem que vier do backend
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<number, string | null> = {
  403: 'Acesso negado.',
  429: null,
  500: 'Erro do servidor. Tente novamente em instantes.',
  502: 'Erro do servidor. Tente novamente em instantes.',
  503: 'Erro do servidor. Tente novamente em instantes.',
  504: 'Erro do servidor. Tente novamente em instantes.',
};

// Statuses que são repassados silenciosamente ao componente quando não tem
// code field no ERROR_CODE_MAP. Cobre 404s genéricos e 400s sem code (ex:
// BadRequestException lançada diretamente em código, fora do ValidationPipe).
const PASSTHROUGH_STATUSES = new Set([400, 404]);

// Estado de refresh (module-level para sobreviver à injeção do interceptor)
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (SKIP_PATHS.some((path) => req.url.includes(path))) {
        return throwError(() => err);
      }

      if (err.status === 401) {
        return handle401(req, next, auth, toast);
      }

      return handleError(err, toast);
    }),
  );
};

// 401: tenta refresh; se falhar, faz logout + toast "Sessão expirada"
function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  toast: ToastService,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshedToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(cloneWithToken(req, token))),
    );
  }

  isRefreshing = true;
  refreshedToken$.next(null);

  return auth.refresh().pipe(
    switchMap((newToken) => {
      isRefreshing = false;
      refreshedToken$.next(newToken);
      return next(cloneWithToken(req, newToken));
    }),
    catchError((refreshErr: unknown) => {
      isRefreshing = false;
      refreshedToken$.next(null);
      toast.show('error', 'Sessão expirada, faça login novamente.');
      auth.logout('expired');
      return throwError(() => refreshErr);
    }),
  );
}

// ---------------------------------------------------------------------------
// Outros erros (não-401): normaliza em AppError e decide se dispara o toast.
//
// Toast NÃO é disparado quando:
//   1 - o code field está no ERROR_CODE_MAP com valor false -> passthrough (ex: validation_failed - componente cuida dos campos)
//   2 - não tem code field E o status está em PASSTHROUGH_STATUSES (400, 404) -> passthrough de fallback para quando o backend não envia code
//
// Toast é disparado em todos os outros casos (403, 429, 5xx, rede).
// ---------------------------------------------------------------------------
function handleError(
  err: HttpErrorResponse,
  toast: ToastService,
): Observable<never> {
  const appError: AppError = {
    status: err.status,
    message: resolveMessage(err),
    details: err.error,
  };

  if (isPassthrough(err)) {
    return throwError(() => appError);
  }

  const message = resolveToastMessage(err);
  if (message) {
    if (err.status === 0) {
      toast.show('error', message, {
        label: 'Tentar novamente',
        callback: () => window.location.reload(),
      });
    } else {
      toast.show('error', message);
    }
  }

  return throwError(() => appError);
}

// Helpers privados
function isPassthrough(err: HttpErrorResponse): boolean {
  const code: string | undefined = err.error?.code;
  if (code && code in ERROR_CODE_MAP) {
    return ERROR_CODE_MAP[code] === false;
  }
  return PASSTHROUGH_STATUSES.has(err.status);
}

function resolveMessage(err: HttpErrorResponse): string {
  const code: string | undefined = err.error?.code;

  if (code && code in ERROR_CODE_MAP) {
    const mapped = ERROR_CODE_MAP[code];
    if (mapped === false || mapped === null) {
      return err.error?.message ?? fallbackForStatus(err.status);
    }
    return mapped;
  }

  return fallbackForStatus(err.status);
}

function resolveToastMessage(err: HttpErrorResponse): string | null {
  const code: string | undefined = err.error?.code;

  if (code && code in ERROR_CODE_MAP) {
    const mapped = ERROR_CODE_MAP[code];
    if (mapped === false) return null;
    if (mapped === null) return err.error?.message ?? null;
    return mapped;
  }

  if (err.status in STATUS_MAP) {
    const mapped = STATUS_MAP[err.status];
    return mapped ?? err.error?.message ?? null;
  }

  if (err.status === 0) return 'Sem conexão com o servidor.';
  if (err.status >= 500) return 'Erro do servidor. Tente novamente em instantes.';

  return null;
}

function fallbackForStatus(status: number): string {
  if (status === 0) return 'Sem conexão com o servidor.';
  if (status >= 500) return 'Erro do servidor. Tente novamente em instantes.';
  if (status === 403) return 'Acesso negado.';
  if (status === 429) return 'Muitas tentativas. Aguarde e tente novamente.';
  return 'Ocorreu um erro inesperado.';
}

function cloneWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
