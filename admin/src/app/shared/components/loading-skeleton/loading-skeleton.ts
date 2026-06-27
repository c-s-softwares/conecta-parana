import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  templateUrl: './loading-skeleton.html',
})
export class LoadingSkeleton {
  rows = input<number>(3);
  height = input<string>('1rem');

  protected rowArray = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  protected widths = ['100%', '85%', '70%'];
}
