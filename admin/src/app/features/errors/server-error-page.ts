import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorPage } from './error-page';

@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [ErrorPage, RouterLink],
  template: `
    <app-error-page
      code="500"
      subtitle="Erro interno do servidor"
      errorTitle="Algo deu errado"
      description="Tivemos um problema ao processar sua solicitação. Já estamos cientes — tente novamente em instantes ou volte ao início do painel."
      iconName="heroExclamationTriangle"
      theme="coral"
      pill="HTTP 500 · sem correlation-id (pós-MVP)"
    >
      <a routerLink="/dashboard" class="btn btn-primary">
        <span>›</span> Voltar ao início
      </a>
      <button type="button" class="btn btn-ghost" (click)="reload()">Tentar novamente</button>
    </app-error-page>
  `,
})
export class ServerErrorPage {
  reload(): void {
    window.location.reload();
  }
}
