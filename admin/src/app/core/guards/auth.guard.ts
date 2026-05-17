import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * @description
 * Exige um usuário autenticado. 
 * 
 * Sem sessão, redireciona para /login preservando a URL pretendida em returnUrl.
 */
export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/**
 * @description
 * Exige a role ADMIN.
 * Um usuário autenticado sem ADMIN é deslogado e redirecionado para /login com aviso de papel negado.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (auth.isAdmin()) {
    return true;
  }
  toast.show('error', 'Acesso negado para este papel.');
  auth.logout('forbidden');
  return router.createUrlTree(['/login'], { queryParams: { reason: 'forbidden' } });
};

/**
 * @description
 * Exige Super Admin (ADMIN com cityId nulo). 
 * 
 * Admin municipal é redirecionado para /dashboard com aviso de acesso restrito.
 */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (auth.isSuperAdmin()) {
    return true;
  }
  toast.show('error', 'Acesso restrito ao Super Admin.');
  return router.createUrlTree(['/dashboard']);
};

/**
 * @description
 * Impede que um administrador já autenticado acesse a página de login -
 * redireciona direto para /posts.
 */
export const loginGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isAdmin()) {
    return router.createUrlTree(['/posts']);
  }
  return true;
};
