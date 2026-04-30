import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  visible = input.required<boolean>();
  title = input<string>('Confirmar exclusão');
  message = input<string>('Tem certeza que deseja excluir este item?');
  confirmed = output<void>();
  cancelled = output<void>();
}
