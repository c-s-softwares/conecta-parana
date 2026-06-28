import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';
import {
  adminGuard,
  authenticatedGuard,
  superAdminGuard,
  unauthenticatedGuard,
} from './core/guards/auth.guard';
import { ERROR_ROUTES } from './features/errors/errors.routes';

const loadPlaceholder = () =>
  import('./shared/components/placeholder-page').then((m) => m.PlaceholderPage);

export const routes: Routes = [
  {
    // Rota de desenvolvimento para visualizar os componentes core (CPR-46). Sem guard.
    path: 'showcase',
    loadComponent: () => import('./features/showcase/showcase.page').then((m) => m.ShowcasePage),
  },
  {
    path: '',
    canMatch: [unauthenticatedGuard],
    loadChildren: () => import('./features/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authenticatedGuard, adminGuard],
    canActivateChild: [authenticatedGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      { path: 'eventos', loadComponent: loadPlaceholder, data: { title: 'Eventos' } },
      { path: 'comunicados', loadComponent: loadPlaceholder, data: { title: 'Comunicados' } },
      { path: 'noticias', loadComponent: loadPlaceholder, data: { title: 'Notícias' } },
      { path: 'locais', loadComponent: loadPlaceholder, data: { title: 'Locais' } },
      { path: 'notificacoes', loadComponent: loadPlaceholder, data: { title: 'Notificações' } },
      {
        path: 'sugestoes',
        loadChildren: () =>
          import('./features/suggestions/suggestions.routes').then((m) => m.SUGGESTIONS_ROUTES),
      },
      {
        path: 'cidades',
        canActivate: [superAdminGuard],
        loadComponent: loadPlaceholder,
        data: { title: 'Cidades' },
      },
      {
        path: 'administradores',
        canActivate: [superAdminGuard],
        loadComponent: loadPlaceholder,
        data: { title: 'Administradores' },
      },
      ...ERROR_ROUTES,
    ],
  },
  { path: '**', redirectTo: '404' },
];

