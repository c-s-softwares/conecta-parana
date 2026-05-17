import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-placeholder.page').then(
        (m) => m.DashboardPlaceholderPage,
      ),
  },
];
