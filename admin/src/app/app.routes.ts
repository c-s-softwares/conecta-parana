import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [loginGuard],
    loadChildren: () =>
      import('./features/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'posts', pathMatch: 'full' },
      {
        path: 'news',
        loadChildren: () =>
          import('./features/news/news.routes').then((m) => m.NEWS_ROUTES),
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
        path: 'posts',
        loadChildren: () =>
          import('./features/posts/posts.routes').then((m) => m.POSTS_ROUTES),
      },
      {
        path: 'superadmin',
        loadChildren: () =>
          import('./features/superadmin/superadmin.routes').then((m) => m.SUPERADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
