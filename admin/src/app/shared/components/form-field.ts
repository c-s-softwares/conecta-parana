import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  templateUrl: './form-field.html',
})
export class FormField {
  label = input.required<string>();
  fieldId = input.required<string>();
  required = input<boolean>(false);
  errorMessage = input<string>('');
  showError = input<boolean>(false);
}
