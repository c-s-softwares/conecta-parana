import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField } from '../../shared/components/form-field/form-field';
import { AuthService } from '../../core/services/auth.service';
import { AuthError, AuthErrorKind } from '../../core/services/auth.model';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormField],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loading = signal(false);

  get emailTouched(): boolean {
    return this.form.controls.email.touched;
  }

  get emailError(): string {
    const ctrl = this.form.controls.email;
    if (ctrl.hasError('required')) return 'E-mail é obrigatório.';
    if (ctrl.hasError('email')) return 'E-mail inválido.';
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
        this.loading.set(false);
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
        return 'Usuário sem permissão de administrador.';
      default:
        return 'Não foi possível entrar. Tente novamente.';
    }
  }
}
