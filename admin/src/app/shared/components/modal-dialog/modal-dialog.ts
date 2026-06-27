import { Component, effect, ElementRef, inject, input, output, viewChild, DestroyRef } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-modal-dialog',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './modal-dialog.html',
  host: {
    '(document:keydown.escape)': 'onEsc()'
  }
})
export class ModalDialog {
  private readonly destroyRef = inject(DestroyRef);

  visible = input.required<boolean>();
  title = input<string>('');
  eyebrow = input<string>('');
  subtitle = input<string>('');
  size = input<'s' | 'm' | 'l'>('m');
  dismissOnBackdrop = input<boolean>(true);
  footer = input<boolean>(false);

  cancelled = output<void>();

  private dialogPanel = viewChild<ElementRef<HTMLElement>>('dialogPanel');

  constructor() {
    effect(() => {
      if (this.visible()) {
        document.body.classList.add('overflow-hidden');
        setTimeout(() => {
          this.dialogPanel()?.nativeElement.focus();
        });
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    });

    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('overflow-hidden');
    });
  }

  protected onEsc(): void {
    if (this.visible()) {
      this.cancelled.emit();
    }
  }

  protected onBackdropClick(): void {
    if (this.dismissOnBackdrop()) {
      this.cancelled.emit();
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.visible()) return;

    const element = this.dialogPanel()?.nativeElement;
    if (!element) return;

    const focusables = element.querySelectorAll<HTMLElement>(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable], audio[controls], video[controls], summary'
    );

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first || document.activeElement === element) {
        last.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }
  }

}
