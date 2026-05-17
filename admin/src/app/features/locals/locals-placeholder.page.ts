import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Locais (rota /locals).
 *
 * Componente antigo de referência:
 *   ./locals.page.ts -> LocalsPage (marcado como deprecated)
 */
@Component({
  selector: 'app-locals-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Locais" />`,
})
export class LocalsPlaceholderPage {}
