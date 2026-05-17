import { Routes } from '@angular/router';

export const LOCALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./locals-placeholder.page').then(
        (m) => m.LocalsPlaceholderPage,
      ),
  },
];
