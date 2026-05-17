import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Dashboard (rota /dashboard).
 *
 * Rota nova: não há componente antigo de referência.
 */
@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Dashboard" />`,
})
export class DashboardPlaceholderPage {}
