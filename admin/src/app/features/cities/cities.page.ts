import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { formatUlidAsMonthYear } from '../../shared/utils/ulid';
import { CitiesApi } from './cities.api';
import { City, CityStats } from './cities.model';

@Component({
  selector: 'app-cities-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIcon],
  templateUrl: './cities.page.html',
})
export class CitiesPage implements OnInit {
  private readonly api = inject(CitiesApi);

  protected readonly items = signal<City[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly stats = signal<CityStats | null>(null);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly filteredItems = computed(() => {
    const term = this.searchTerm();
    if (!term) return this.items();
    return this.items().filter((c) => c.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.load();
    this.loadStats();
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerm.set(value.trim().toLowerCase());
    });
  }

  private loadStats(): void {
    this.api.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => this.stats.set(null),
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({ page: this.page(), pageSize: this.pageSize() })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Não foi possível carregar as cidades.');
        },
      });
  }

  protected nextPage(): void {
    if (this.canGoNext) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  protected prevPage(): void {
    if (this.canGoPrev) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  protected formatSince(id: string): string {
    return formatUlidAsMonthYear(id);
  }

  get canGoPrev(): boolean {
    return !this.searchTerm() && this.page() > 1;
  }

  get canGoNext(): boolean {
    return !this.searchTerm() && this.page() * this.pageSize() < this.total();
  }

  get rangeLabel(): string {
    if (this.searchTerm()) {
      const count = this.filteredItems().length;
      const noun = count === 1 ? 'cidade' : 'cidades';
      return `${count} ${noun} na página atual`;
    }
    if (this.total() === 0) return '0 de 0';
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = (this.page() - 1) * this.pageSize() + this.items().length;
    return `${start}–${end} de ${this.total()}`;
  }
}
