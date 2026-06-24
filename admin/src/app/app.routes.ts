import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';
import {
  adminGuard,
  authenticatedGuard,
  superAdminGuard,
  unauthenticatedGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canMatch: [unauthenticatedGuard],
    loadChildren: () =>
      import('./features/login/login.routes').then((m) => m.LOGIN_ROUTES),
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
      {
        path: 'news',
        loadChildren: () =>
          import('./features/news/news.routes').then((m) => m.NEWS_ROUTES),
      },
      {
        path: 'locals',
        loadChildren: () =>
          import('./features/locals/locals.routes').then((m) => m.LOCALS_ROUTES),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notification/notification.routes').then((m) => m.NOTIFICATION_ROUTES),
      },
      {
        path: 'events',
        loadChildren: () =>
          import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
      },
      {
        path: 'cities',
        canActivate: [superAdminGuard],
        loadChildren: () =>
          import('./features/cities/cities.routes').then((m) => m.CITIES_ROUTES),
      },
      {
        path: 'admins',
        canActivate: [superAdminGuard],
        loadChildren: () =>
          import('./features/admins/admins.routes').then((m) => m.ADMINS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
