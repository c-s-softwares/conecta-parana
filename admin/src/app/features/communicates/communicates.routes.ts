import { Routes } from '@angular/router';

export const COMMUNICATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./communicates.page').then((m) => m.CommunicatesPage),
  },
];