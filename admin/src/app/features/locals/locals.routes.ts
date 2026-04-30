import { Routes } from '@angular/router';

export const LOCALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./locals.page').then((m) => m.LocalsPage),
  },
];
