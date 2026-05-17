import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Administradores (rota /superadmin).
 *
 * Componente antigo de referência:
 *   ./superadmin.page.ts -> SuperadminPage (marcado como deprecated)
 */
@Component({
  selector: 'app-admins-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Administradores" />`,
})
export class AdminsPlaceholderPage {}
