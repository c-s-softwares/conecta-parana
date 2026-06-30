import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { SugestoesApi } from './suggestions.api';
import { SuggestionResponseDto } from './suggestions.model';
import { ToastService } from '../../core/services/toast.service';
import { extractDateFromUlid } from '../../shared/utils/ulid';

@Component({
  selector: 'app-suggestions-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialog],
  templateUrl: './suggestions.page.html',
})
export class SuggestionsPage implements OnInit {
  private readonly api = inject(SugestoesApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly suggestions = signal<SuggestionResponseDto[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedStatusFilter = signal<string>('Todas');
  readonly expandedId = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly archiveDialogVisible = signal<boolean>(false);
  readonly bulkArchiveDialogVisible = signal<boolean>(false);
  private pendingArchiveId: string | null = null;


  readonly responseForm = this.fb.group({
    response: ['', Validators.required],
  });


  readonly filteredSuggestions = computed(() => {
    let list = this.suggestions();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedStatusFilter();


    if (filter !== 'Todas') {
      list = list.filter((item) => {
        if (filter === 'Enviadas') return item.status === 'enviada';
        if (filter === 'Lidas') return item.status === 'lida';
        if (filter === 'Respondidas') return item.status === 'respondida';
        if (filter === 'Concluídas') return item.status === 'concluída';
        if (filter === 'Arquivadas') return item.status === 'arquivada';
        return true;
      });
    }

  
    if (query) {
      list = list.filter((item) => {
        const subject = item.subject.toLowerCase();
        const message = item.message.toLowerCase();
        const user = (item.user?.name ?? '').toLowerCase();

        return (
          subject.includes(query) ||
          message.includes(query) ||
          user.includes(query) ||
          item.id.toLowerCase().includes(query)
        );
      });
    }

    return list;
  });

 
  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly isAllSelected = computed(() => {
    const visible = this.filteredSuggestions();
    if (visible.length === 0) return false;
    const selected = this.selectedIds();
    return visible.every((item) => selected.has(item.id));
  });

  ngOnInit(): void {
    this.loadSuggestions();
  }

  loadSuggestions(): void {
    this.api.listCitySuggestions().subscribe({
      next: (data) => {
        this.suggestions.set(data);
      },
      error: (err) => this.handleError(err),
    });
  }

  formatDate(dateVal?: string | Date | null): string {
    if (!dateVal) return '';
    let date: Date;
    if (dateVal instanceof Date) {
      date = dateVal;
    } else {
      const str = String(dateVal);
      if (str.startsWith('sgt_')) {
        const extracted = extractDateFromUlid(str);
        if (!extracted) return '';
        date = extracted;
      } else {
        let normalizedStr = str;
        if (!normalizedStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(normalizedStr)) {
          normalizedStr += 'Z';
        }
        date = new Date(normalizedStr);
      }
    }

    if (isNaN(date.getTime())) return '';

    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }


  toggleExpand(item: SuggestionResponseDto): void {
    if (this.expandedId() === item.id) {
      this.expandedId.set(null);
    } else {
      this.expandedId.set(item.id);
      this.responseForm.controls.response.setValue(item.response || '');

      if (item.status === 'enviada') {
        this.api.getSuggestionDetail(item.id).subscribe({
          next: (updated) => {
            this.updateLocalItem(updated);
          },
          error: (err) => this.handleError(err),
        });
      }
    }
  }

  toggleSelect(id: string, event: Event): void {
    event.stopPropagation();
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const visibleIds = this.filteredSuggestions().map((item) => item.id);
      this.selectedIds.set(new Set(visibleIds));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  canRespond(status: string): boolean {
    return status === 'enviada' || status === 'lida';
  }

  canConclude(status: string): boolean {
    return status === 'respondida';
  }

  canArchive(status: string): boolean {
    return status !== 'concluída' && status !== 'arquivada';
  }

  submitRespond(item: SuggestionResponseDto): void {
    if (this.responseForm.invalid) return;
    const responseText = this.responseForm.value.response || '';

    this.api.respond(item.id, responseText).subscribe({
      next: (updated) => {
        this.toast.show('success', 'Sugestão respondida com sucesso.');
        this.updateLocalItem(updated);
        this.expandedId.set(null);
      },
      error: (err) => this.handleError(err),
    });
  }

  submitConclude(item: SuggestionResponseDto): void {
    if (this.responseForm.invalid) return;
    const responseText = this.responseForm.value.response || '';

    this.api.conclude(item.id, responseText).subscribe({
      next: (updated) => {
        this.toast.show('success', 'Sugestão concluída com sucesso.');
        this.updateLocalItem(updated);
        this.expandedId.set(null);
      },
      error: (err) => this.handleError(err),
    });
  }

  confirmArchive(item: SuggestionResponseDto): void {
    this.pendingArchiveId = item.id;
    this.archiveDialogVisible.set(true);
  }

  executeArchive(): void {
    if (!this.pendingArchiveId) return;
    const id = this.pendingArchiveId;
    const responseText = this.responseForm.value.response || 'Sugestão arquivada.';

    this.api.archive(id, responseText).subscribe({
      next: (updated) => {
        this.toast.show('success', 'Sugestão arquivada com sucesso.');
        this.updateLocalItem(updated);
        this.expandedId.set(null);
        this.cancelArchive();
      },
      error: (err) => {
        this.cancelArchive();
        this.handleError(err);
      },
    });
  }

  cancelArchive(): void {
    this.pendingArchiveId = null;
    this.archiveDialogVisible.set(false);
  }

  marcarComoLidas(): void {
    const selected = Array.from(this.selectedIds());
    const enviadas = this.suggestions().filter(
      (item) => selected.includes(item.id) && item.status === 'enviada'
    );

    if (enviadas.length === 0) {
      this.toast.show('info', 'Nenhuma sugestão enviada (não lida) selecionada.');
      return;
    }

    const requests = enviadas.map((item) =>
      this.api.getSuggestionDetail(item.id).pipe(
        catchError((err) => {
          console.error(`Erro ao ler sugestão ${item.id}`, err);
          return of(null);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const successes = results.filter((res): res is SuggestionResponseDto => res !== null);
        successes.forEach((updated) => this.updateLocalItem(updated));
        this.selectedIds.set(new Set());
        this.toast.show('success', `${successes.length} sugestões marcadas como lidas.`);
      },
    });
  }

  confirmBulkArchive(): void {
    this.bulkArchiveDialogVisible.set(true);
  }

  executeBulkArchive(): void {
    const selected = Array.from(this.selectedIds());
    const toArchive = this.suggestions().filter(
      (item) => selected.includes(item.id) && item.status !== 'concluída' && item.status !== 'arquivada'
    );

    if (toArchive.length === 0) {
      this.toast.show('info', 'Nenhuma sugestão elegível para arquivamento selecionada.');
      this.bulkArchiveDialogVisible.set(false);
      return;
    }

    const requests = toArchive.map((item) =>
      this.api.archive(item.id, 'Sugestão arquivada.').pipe(
        catchError((err) => {
          console.error(`Erro ao arquivar sugestão ${item.id}`, err);
          return of(null);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const successes = results.filter((res): res is SuggestionResponseDto => res !== null);
        successes.forEach((updated) => this.updateLocalItem(updated));
        this.selectedIds.set(new Set());
        this.bulkArchiveDialogVisible.set(false);
        this.toast.show('success', `${successes.length} sugestões arquivadas com sucesso.`);
      },
      error: () => {
        this.bulkArchiveDialogVisible.set(false);
      }
    });
  }

  cancelBulkArchive(): void {
    this.bulkArchiveDialogVisible.set(false);
  }

  private updateLocalItem(updated: SuggestionResponseDto): void {
    this.suggestions.update((list) =>
      list.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  private handleError(err: unknown): void {
    const appError = err as { status: number; message: string; details?: { code?: string; message?: string } } | null;
    const code = appError?.details?.code;
    if (code === 'invalid_status_transition') {
      this.toast.show('error', 'Não é possível arquivar/concluir uma sugestão sem resposta.');
      this.loadSuggestions();
    } else if (code === 'not_owner_or_admin') {
      this.toast.show('error', 'Você não tem permissão para esta sugestão.');
      this.router.navigate(['/sugestoes']);
    } else if (code === 'suggestion_not_found') {
      this.toast.show('error', 'Sugestão não encontrada.');
      this.loadSuggestions();
    } else {
      this.toast.show('error', appError?.details?.message || 'Ocorreu um erro inesperado.');
    }
  }
}
