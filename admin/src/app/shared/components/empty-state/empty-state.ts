import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HERO_ICONS } from '../../icons/hero-icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
})
export class EmptyState {
  private readonly sanitizer = inject(DomSanitizer);

  title = input<string>('Nenhum item encontrado');
  description = input<string>('');
  icon = input<string>(''); //chave d heroicons

  protected iconHtml = computed<SafeHtml>(() => {
    const iconName = this.icon();
    const svg = HERO_ICONS[iconName] || HERO_ICONS['inbox'];
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });
}
