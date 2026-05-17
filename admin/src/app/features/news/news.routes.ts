import { Routes } from '@angular/router';

export const NEWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./news-placeholder.page').then(
        (m) => m.NewsPlaceholderPage,
      ),
  },
];
