import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh'];

/**
 * @description
 * Adiciona o cabeçalho `Authorization: Bearer <token>` nas requisições de saída,
 * menos nos endpoints públicos de autenticação (login e refresh).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (PUBLIC_PATHS.some((path) => req.url.includes(path))) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  if (!token) {
    return next(req);
  }

  const authorized = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authorized);
};
