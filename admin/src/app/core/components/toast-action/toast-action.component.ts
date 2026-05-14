import { Component, inject } from '@angular/core';
import { HotToastRef } from '@ngxpert/hot-toast';

export interface ToastActionData {
  message: string;
  label: string;
  callback: () => void;
}

@Component({
  standalone: true,
  template: `
    <span>{{ ref.data.message }}</span>
    <button
      type="button"
      class="ml-2 roundedtext-sm font-bold underline cursor-pointer hover:no-underline"
      (click)="act()"
    >{{ ref.data.label }}</button>
  `,
})
export class ToastActionComponent {
  protected readonly ref = inject(HotToastRef<ToastActionData>);

  protected act(): void {
    this.ref.data.callback();
    this.ref.close({ dismissedByAction: true });
  }
}
