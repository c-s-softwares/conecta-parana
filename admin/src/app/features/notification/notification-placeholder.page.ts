import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Notificações (rota /notifications).
 *
 * Componente antigo de referência:
 *   ./notification.page.ts -> NotificationComponent (marcado como deprecated)
 */
@Component({
  selector: 'app-notification-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Notificações" />`,
})
export class NotificationPlaceholderPage {}
