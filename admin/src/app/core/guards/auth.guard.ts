import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * @description
 * Protege rotas autenticadas: o usuário deve estar logado e ter a função ADMIN.
 * Usuários sem a função ADMIN são deslogados e redirecionados para /login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!auth.isAdmin()) {
    auth.logout('forbidden');
    return router.createUrlTree(['/login'], { queryParams: { reason: 'forbidden' } });
  }

  return true;
};

/**
 * @description
 * Impede que um administrador já autenticado acesse a página de login —
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
