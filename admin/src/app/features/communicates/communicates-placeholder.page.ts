import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Comunicados (rota /communicates).
 *
 * Componente antigo de referência:
 *   ./communicates.page.ts -> CommunicatesPage (marcado como deprecated)
 */
@Component({
  selector: 'app-communicates-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Comunicados" />`,
})
export class CommunicatesPlaceholderPage {}
