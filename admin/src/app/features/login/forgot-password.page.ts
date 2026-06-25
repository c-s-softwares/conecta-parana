import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthError, AuthErrorKind } from '../../core/services/auth.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;

type Step = 1 | 2 | 3 | 'done';

function strongPassword(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string) ?? '';
  const ok = value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
  return ok ? null : { weak: true };
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value as string;
  const confirmPassword = group.get('confirmPassword')?.value as string;
  return newPassword === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.css',
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly resendInfo = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly emailControl = this.fb.nonNullable.control('', [
    Validators.required,
    Validators.email,
    Validators.pattern(EMAIL_PATTERN),
  ]);

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, strongPassword]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected readonly email = signal('');
  protected readonly codeDigits = signal<string[]>(Array(6).fill(''));
  protected readonly code = computed(() => this.codeDigits().join(''));
  protected readonly codeComplete = computed(() => /^\d{6}$/.test(this.code()));

  private codeDeadline = 0;
  protected readonly remainingMs = signal(0);
  protected readonly expired = computed(() => this.remainingMs() <= 0);
  protected readonly countdown = computed(() => {
    const total = Math.max(0, Math.ceil(this.remainingMs() / 1000));
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  protected readonly heroStep = computed<number>(() => {
    const s = this.step();
    return s === 'done' ? 3 : s;
  });

  private readonly newPasswordValue = toSignal(this.passwordForm.controls.newPassword.valueChanges, {
    initialValue: '',
  });
  protected readonly reqMinLength = computed(() => this.newPasswordValue().length >= 8);
  protected readonly reqLetter = computed(() => /[A-Za-z]/.test(this.newPasswordValue()));
  protected readonly reqNumber = computed(() => /\d/.test(this.newPasswordValue()));
  protected readonly passwordScore = computed(
    () => [this.reqMinLength(), this.reqLetter(), this.reqNumber()].filter(Boolean).length,
  );

  constructor() {
    const id = setInterval(() => {
      if (this.codeDeadline) this.remainingMs.set(this.codeDeadline - Date.now());
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  get emailError(): string {
    const ctrl = this.emailControl;
    if (!ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'E-mail é obrigatório.';
    if (ctrl.hasError('email') || ctrl.hasError('pattern')) return 'E-mail inválido.';
    return '';
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submitEmail(): void {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }
    const email = this.emailControl.getRawValue().trim();
    this.start();
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.email.set(email);
        this.startCodeTimer();
        this.step.set(2);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  submitCode(): void {
    if (!this.codeComplete()) return;
    this.start();
    this.auth.verifyResetCode(this.email(), this.code()).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(3);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  resendCode(): void {
    this.errorMessage.set(null);
    this.resendInfo.set(null);
    this.auth.forgotPassword(this.email()).subscribe({
      next: () => {
        this.startCodeTimer();
        this.resendInfo.set('Enviamos um novo código para o seu e-mail.');
      },
      error: (err: unknown) => this.errorMessage.set(this.messageFor(err)),
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.start();
    this.auth.resetPassword(this.email(), this.code(), this.passwordForm.getRawValue().newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('done');
      },
      error: (err: unknown) => {
        this.fail(err);
        // Código inválido/expirado: devolve ao passo 2 para reenviar/corrigir.
        if (err instanceof AuthError && err.kind === 'invalid_or_expired_code') {
          this.step.set(2);
        }
      },
    });
  }

  back(): void {
    this.errorMessage.set(null);
    this.resendInfo.set(null);
    if (this.step() === 3) this.step.set(2);
    else if (this.step() === 2) this.step.set(1);
  }

  goToLogin(): void {
    void this.router.navigateByUrl('/');
  }

  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    const digits = [...this.codeDigits()];
    digits[index] = digit;
    this.codeDigits.set(digits);
    input.value = digit;
    this.errorMessage.set(null);
    if (digit) (input.nextElementSibling as HTMLInputElement | null)?.focus();
  }

  onCodeKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace') return;
    const input = event.target as HTMLInputElement;
    if (input.value) return;
    const prev = input.previousElementSibling as HTMLInputElement | null;
    if (!prev) return;
    const digits = [...this.codeDigits()];
    digits[index - 1] = '';
    this.codeDigits.set(digits);
    prev.value = '';
    prev.focus();
  }

  onCodePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (!pasted) return;
    event.preventDefault();
    const digits = Array(6).fill('') as string[];
    for (let i = 0; i < pasted.length; i++) digits[i] = pasted[i];
    this.codeDigits.set(digits);
    this.errorMessage.set(null);
  }

  private startCodeTimer(): void {
    this.codeDeadline = Date.now() + CODE_TTL_MS;
    this.remainingMs.set(CODE_TTL_MS);
  }

  private start(): void {
    this.errorMessage.set(null);
    this.resendInfo.set(null);
    this.loading.set(true);
  }

  private fail(err: unknown): void {
    this.loading.set(false);
    this.errorMessage.set(this.messageFor(err));
  }

  private messageFor(err: unknown): string {
    const kind: AuthErrorKind = err instanceof AuthError ? err.kind : 'unknown';
    switch (kind) {
      case 'invalid_or_expired_code':
        return 'Código inválido ou expirado. Verifique e tente novamente.';
      case 'weak_password':
        return 'A senha deve ter ao menos 8 caracteres, com 1 letra e 1 número.';
      case 'email_not_verified':
        return 'E-mail ainda não verificado. Enviamos um código de verificação para ele.';
      case 'too_many_attempts':
        return 'Muitas tentativas. Aguarde alguns minutos.';
      case 'server_unreachable':
        return 'Servidor fora do ar. Tente novamente em instantes.';
      default:
        return 'Não foi possível concluir. Tente novamente.';
    }
  }
}
