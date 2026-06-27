import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.html',
})
export class PageHeader {
  title = input.required<string>();
  buttonLabel = input.required<string>();
  create = output<void>();
}
