import { Component, inject, input, output, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HERO_ICONS } from '../icons/hero-icons';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './entity-list.html',
})
export class EntityList {
  private readonly sanitizer = inject(DomSanitizer);

  items = input.required<unknown[]>();
  rowTemplate = input.required<TemplateRef<unknown>>();
  edit = output<unknown>();
  delete = output<unknown>();

  get editIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(HERO_ICONS['pencilSquare']);
  }

  get deleteIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(HERO_ICONS['trash']);
  }
}
