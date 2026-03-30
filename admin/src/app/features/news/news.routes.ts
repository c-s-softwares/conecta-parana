import { Routes } from '@angular/router';

export const NEWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./news.page').then((m) => m.NewsPage),
  },
];
