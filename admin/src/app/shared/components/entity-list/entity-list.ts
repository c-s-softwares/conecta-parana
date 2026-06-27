import { Component, input, output, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [NgTemplateOutlet, NgIcon],
  templateUrl: './entity-list.html',
})
export class EntityList {
  items = input.required<unknown[]>();
  rowTemplate = input.required<TemplateRef<unknown>>();
  edit = output<unknown>();
  delete = output<unknown>();
}
