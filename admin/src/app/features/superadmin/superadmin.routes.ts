import { Routes } from '@angular/router';

export const SUPERADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admins-placeholder.page').then(
        (m) => m.AdminsPlaceholderPage,
      ),
  },
];