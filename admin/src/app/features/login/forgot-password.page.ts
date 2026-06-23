import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="login-shell">
      <div class="login-panel">
        <img src="logo-conecta.png" alt="Conecta Paraná" class="brand-mark" style="width: 40px; height: 40px; margin-bottom: 32px" />
        <h1 class="h1" style="font-size: 30px">Em breve</h1>
        <p class="muted" style="margin-top: 8px; font-size: 15px; max-width: 42ch">
          A recuperação de senha ainda não está disponível. Procure o administrador estadual para
          redefinir o acesso.
        </p>
        <a routerLink="/" class="link" style="margin-top: 28px">Voltar para o login</a>
      </div>
    </div>
  `,
})
export class ForgotPasswordPage {}
