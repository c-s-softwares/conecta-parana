import { Component, input } from '@angular/core';

/**
 * Componente de página em construção (placeholder).
 *
 * Usado temporariamente pelas rotas do admin 
 * enquanto o design real não é implementado.
 */
@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <div
      class="flex h-full min-h-[60vh] w-full items-center justify-center rounded-lg bg-admin-primary-light p-8"
    >
      <p class="text-admin-text-primary text-h3 font-bold">
        Página {{ title() }} em desenvolvimento
      </p>
    </div>
  `,
})
export class PlaceholderPage {
  readonly title = input.required<string>();
}
