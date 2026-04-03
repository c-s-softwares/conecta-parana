import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./notification.page').then((m) => m.NotificationComponent),
  },
];