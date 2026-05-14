import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { ToastService } from './app/core/services/toast.service';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    if (!environment.production) {
      (window as any).__toast = appRef.injector.get(ToastService);
      console.info(
        '[dev] ToastService exposto em window.__toast\n' +
        "  __toast.show('success', 'Mensagem')\n" +
        "  __toast.show('error', 'Mensagem')\n" +
        "  __toast.show('warning', 'Mensagem')\n" +
        "  __toast.show('info', 'Mensagem')\n" +
        "  __toast.show('error', 'Sem conexão.', { label: 'Tentar novamente', callback: () => location.reload() })",
      );
    }
  })
  .catch((err) => console.error(err));
