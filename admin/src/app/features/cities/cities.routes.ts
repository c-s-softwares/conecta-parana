import { Routes } from '@angular/router';

export const CITIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./cities.page').then((m) => m.CitiesPage),
  },
];
