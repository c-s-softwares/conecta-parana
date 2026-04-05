import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormField } from '../../shared/components/form-field';
import { FormContainer } from '../../shared/components/form-container';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormContainer, FormField],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

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

    const { email, rememberMe } = this.form.getRawValue();

    this.auth.login(email).subscribe((user) => {
      if (rememberMe) this.auth.saveToken(user.token);
      this.router.navigate(['/']);
    });
  }
}