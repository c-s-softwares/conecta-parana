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
        path: 'events',
        loadChildren: () =>
          import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
      },
    ],
  },
];
