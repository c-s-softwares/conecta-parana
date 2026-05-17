import { Routes } from '@angular/router';

export const COMMUNICATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./communicates-placeholder.page').then(
        (m) => m.CommunicatesPlaceholderPage,
      ),
  },
];