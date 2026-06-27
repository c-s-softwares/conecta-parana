import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-container',
  standalone: true,
  templateUrl: './form-container.html',
})
export class FormContainer {
  title = input.required<string>();
}
