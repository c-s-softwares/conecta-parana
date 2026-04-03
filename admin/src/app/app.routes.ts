import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', redirectTo: 'news', pathMatch: 'full' },
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
    ],
  },
];