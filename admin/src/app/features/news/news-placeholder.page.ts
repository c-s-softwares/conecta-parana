import { Component } from '@angular/core';
import { PlaceholderPage } from '../../shared/components/placeholder-page';

/**
 * Página placeholder de Notícias (rota /news).
 *
 * Componente antigo de referência:
 *   ./news.page.ts -> NewsPage (marcado como deprecated)
 */
@Component({
  selector: 'app-news-placeholder',
  standalone: true,
  imports: [PlaceholderPage],
  template: `<app-placeholder-page title="Notícias" />`,
})
export class NewsPlaceholderPage {}
