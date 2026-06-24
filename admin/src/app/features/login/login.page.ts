import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthError, AuthErrorKind } from '../../core/services/auth.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);

  get emailTouched(): boolean {
    return this.form.controls.email.touched;
  }

  get emailError(): string {
    const ctrl = this.form.controls.email;
    if (ctrl.hasError('required')) return 'E-mail é obrigatório.';
    if (ctrl.hasError('email') || ctrl.hasError('pattern')) return 'E-mail inválido.';
    return '';
  }

  get passwordTouched(): boolean {
    return this.form.controls.password.touched;
  }

  get passwordError(): string {
    const ctrl = this.form.controls.password;
    if (ctrl.hasError('required')) return 'Senha é obrigatória.';
    if (ctrl.hasError('minlength')) return 'Senha deve ter ao menos 8 caracteres.';
    return '';
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.login(email, password, rememberMe).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl ?? '/dashboard');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: unknown): string {
    const kind: AuthErrorKind = err instanceof AuthError ? err.kind : 'unknown';
    switch (kind) {
      case 'invalid_credentials':
        return 'Email ou senha inválidos.';
      case 'too_many_attempts':
        return 'Muitas tentativas. Aguarde alguns minutos.';
      case 'server_unreachable':
        return 'Servidor fora do ar. Tente novamente em instantes.';
      case 'forbidden_role':
        return 'Acesso restrito a administradores.';
      default:
        return 'Não foi possível entrar. Tente novamente.';
    }
  }
}
