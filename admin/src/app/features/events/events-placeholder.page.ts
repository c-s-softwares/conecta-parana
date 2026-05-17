import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Eventos (rota /events).
 *
 * Componente antigo de referência:
 *   ./events.page.ts -> EventsPage (marcado como deprecated)
 */
@Component({
  selector: 'app-events-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Eventos" />`,
})
export class EventsPlaceholderPage {}
