import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1 class="h1">{{ title }}</h1>
        <p class="lead">Esta tela ainda não foi implementada.</p>
      </div>
    </div>
  `,
})
export class PlaceholderPage {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
