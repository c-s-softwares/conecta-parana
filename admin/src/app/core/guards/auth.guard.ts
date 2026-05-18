import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * @description
 * Exige um usuário autenticado.
 * 
 * Sem sessão, redireciona para a raiz preservando a URL pretendida em returnUrl.
 */
export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
};

/**
 * @description
 * Exige a role ADMIN. 
 * 
 * Um usuário autenticado sem ADMIN é deslogado e redirecionado para a raiz com aviso de papel negado.
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
  return router.createUrlTree(['/'], { queryParams: { reason: 'forbidden' } });
};

/**
 * @description
 * Exige ser um Super Admin (ADMIN com cityId nulo). 
 * 
 * Administrador municipal é redirecionado para /dashboard com aviso de acesso restrito.
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
 * Libera a rota de login na raiz apenas para visitantes não autenticados.
 * 
 * Já autenticado, o match falha e o roteador cai no shell, que redireciona para a área logada.
 */
export const unauthenticatedGuard: CanMatchFn = () => {
  return !inject(AuthService).isAuthenticated();
};
