import { Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  title = input<string>('Nenhum item encontrado');
  description = input<string>('');
  icon = input<string>(''); // chave de heroicons

  protected iconName = computed<string>(() => {
    const name = this.icon();
    if (!name) return 'heroInbox';
    if (name.startsWith('hero')) {
      return name;
    }
    return 'hero' + name.charAt(0).toUpperCase() + name.slice(1);
  });
}
