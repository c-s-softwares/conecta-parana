import { Routes } from '@angular/router';

export const ERROR_ROUTES: Routes = [
  {
    path: '404',
    loadComponent: () => import('./not-found-page').then((m) => m.NotFoundPage),
    data: { title: 'Página não encontrada' },
  },
  {
    path: '403',
    loadComponent: () => import('./forbidden-page').then((m) => m.ForbiddenPage),
    data: { title: 'Acesso negado' },
  },
  {
    path: '500',
    loadComponent: () => import('./server-error-page').then((m) => m.ServerErrorPage),
    data: { title: 'Erro do servidor' },
  },
];
