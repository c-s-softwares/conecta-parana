import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./events-placeholder.page').then(
        (m) => m.EventsPlaceholderPage,
      ),
  },
];
