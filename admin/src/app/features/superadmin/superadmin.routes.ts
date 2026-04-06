import { Routes } from '@angular/router';

export const SUPERADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./superadmin.page').then((m) => m.SuperadminPage),
  },
];