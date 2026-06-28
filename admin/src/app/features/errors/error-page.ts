import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './error-page.html',
})
export class ErrorPage {
  code = input.required<string>();
  subtitle = input.required<string>();
  errorTitle = input.required<string>();
  description = input.required<string>();
  iconName = input.required<string>();
  theme = input<'neutral' | 'amber' | 'coral'>('neutral');
  pill = input<string>();
}
