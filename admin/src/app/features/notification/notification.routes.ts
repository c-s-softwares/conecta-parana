import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notification-placeholder.page').then(
        (m) => m.NotificationPlaceholderPage,
      ),
  },
];