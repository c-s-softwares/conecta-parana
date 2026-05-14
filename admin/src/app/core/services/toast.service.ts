import { Injectable, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

import { ToastActionComponent, ToastActionData } from '../components/toast-action/toast-action.component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  callback: () => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly hot = inject(HotToastService);

  show(type: ToastType, message: string, action?: ToastAction, durationMs = 5000): void {
    if (action) {
      this.hot.error(ToastActionComponent, {
        data: { message, label: action.label, callback: action.callback } satisfies ToastActionData,
        autoClose: true,
        dismissible: true,
      });
      return;
    }

    this.hot[type](message, { duration: durationMs });
  }
}
