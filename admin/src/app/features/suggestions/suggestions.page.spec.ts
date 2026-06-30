/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { SuggestionsPage } from './suggestions.page';
import { SugestoesApi } from './suggestions.api';
import { ToastService } from '../../core/services/toast.service';
import { SuggestionResponseDto } from './suggestions.model';

describe('SuggestionsPage', () => {
  let component: SuggestionsPage;
  let fixture: ComponentFixture<SuggestionsPage>;
  let apiMock: any;
  let toastMock: any;
  let routerMock: any;

  const mockSuggestions: SuggestionResponseDto[] = [
    {
      id: 'sgt_001',
      subject: 'Ciclovia na Av. Brasil',
      message: 'Precisamos de mais ciclovias urgentes.',
      status: 'enviada',
      userId: 'usr_1',
      cityId: 'cit_1',
      user: { id: 'usr_1', name: 'Camila Souza' },
    },
    {
      id: 'sgt_002',
      subject: 'Mais árvores na Rua XV',
      message: 'A rua XV está muito quente no verão.',
      status: 'lida',
      userId: 'usr_2',
      cityId: 'cit_1',
      user: { id: 'usr_2', name: 'Rafael Lima' },
      response: 'Vamos analisar.',
    },
    {
      id: 'sgt_003',
      subject: 'Ponto de ônibus coberto',
      message: 'Os alunos passam frio esperando o ônibus.',
      status: 'respondida',
      userId: 'usr_3',
      cityId: 'cit_1',
      user: { id: 'usr_3', name: 'Ana Paula' },
      response: 'Resposta inicial.',
    },
    {
      id: 'sgt_004',
      subject: 'Academia ao ar livre',
      message: 'Academia para os idosos no parque.',
      status: 'concluída',
      userId: 'usr_4',
      cityId: 'cit_1',
      user: { id: 'usr_4', name: 'Carlos Mendes' },
      response: 'Instalada com sucesso.',
    },
    {
      id: 'sgt_005',
      subject: 'Iluminação LED nas praças',
      message: 'Muito escuro à noite.',
      status: 'arquivada',
      userId: 'usr_5',
      cityId: 'cit_1',
      user: { id: 'usr_5', name: 'Beatriz Costa' },
    },
  ];

  beforeEach(async () => {
    apiMock = {
      listCitySuggestions: vi.fn().mockReturnValue(of(mockSuggestions)),
      getSuggestionDetail: vi.fn().mockReturnValue(of(mockSuggestions[0])),
      respond: vi.fn(),
      conclude: vi.fn(),
      archive: vi.fn(),
    };

    toastMock = {
      show: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SuggestionsPage],
      providers: [
        { provide: SugestoesApi, useValue: apiMock },
        { provide: ToastService, useValue: toastMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load suggestions on init', () => {
    expect(component).toBeTruthy();
    expect(apiMock.listCitySuggestions).toHaveBeenCalled();
    expect(component.suggestions().length).toBe(5);
  });

  it('should filter suggestions by status', () => {
    expect(component.filteredSuggestions().length).toBe(5);

    component.selectedStatusFilter.set('Enviadas');
    expect(component.filteredSuggestions().length).toBe(1);
    expect(component.filteredSuggestions()[0].id).toBe('sgt_001');

    component.selectedStatusFilter.set('Respondidas');
    expect(component.filteredSuggestions().length).toBe(1);
    expect(component.filteredSuggestions()[0].id).toBe('sgt_003');

    component.selectedStatusFilter.set('Concluídas');
    expect(component.filteredSuggestions().length).toBe(1);
    expect(component.filteredSuggestions()[0].id).toBe('sgt_004');
  });

  it('should filter suggestions by search query', () => {
    component.searchQuery.set('Ciclovia');
    expect(component.filteredSuggestions().length).toBe(1);
    expect(component.filteredSuggestions()[0].id).toBe('sgt_001');

    component.searchQuery.set('muito quente');
    expect(component.filteredSuggestions().length).toBe(1);
    expect(component.filteredSuggestions()[0].id).toBe('sgt_002');
  });

  it('should toggle expand and automatically mark as read if status is enviada', () => {
    const item = mockSuggestions[0]; // status: 'enviada'
    const updatedItem = { ...item, status: 'lida' };
    apiMock.getSuggestionDetail.mockReturnValue(of(updatedItem));

    component.toggleExpand(item);
    expect(component.expandedId()).toBe(item.id);
    expect(apiMock.getSuggestionDetail).toHaveBeenCalledWith(item.id);
    expect(component.suggestions().find(s => s.id === item.id)?.status).toBe('lida');

    component.toggleExpand(item);
    expect(component.expandedId()).toBeNull();
  });

  it('should respond to a suggestion successfully', () => {
    const item = mockSuggestions[1];
    const responseText = 'Obrigado pelo contato. Vamos agir.';
    const updatedItem = { ...item, status: 'respondida', response: responseText };

    apiMock.respond.mockReturnValue(of(updatedItem));
    component.toggleExpand(item);

    component.responseForm.controls.response.setValue(responseText);
    component.submitRespond(item);

    expect(apiMock.respond).toHaveBeenCalledWith(item.id, responseText);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sugestão respondida com sucesso.');
    expect(component.suggestions().find(s => s.id === item.id)?.status).toBe('respondida');
    expect(component.expandedId()).toBeNull();
  });

  it('should conclude a suggestion successfully', () => {
    const item = mockSuggestions[2];
    const responseText = 'Concluído!';
    const updatedItem = { ...item, status: 'concluída', response: responseText };

    apiMock.conclude.mockReturnValue(of(updatedItem));
    component.toggleExpand(item);

    component.responseForm.controls.response.setValue(responseText);
    component.submitConclude(item);

    expect(apiMock.conclude).toHaveBeenCalledWith(item.id, responseText);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sugestão concluída com sucesso.');
    expect(component.suggestions().find(s => s.id === item.id)?.status).toBe('concluída');
    expect(component.expandedId()).toBeNull();
  });

  it('should archive a suggestion successfully', () => {
    const item = mockSuggestions[2]; 
    const updatedItem = { ...item, status: 'arquivada' };

    apiMock.archive.mockReturnValue(of(updatedItem));
    component.toggleExpand(item);
    component.confirmArchive(item);

    expect(component.archiveDialogVisible()).toBe(true);

    component.executeArchive();

    expect(apiMock.archive).toHaveBeenCalledWith(item.id, 'Resposta inicial.');
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sugestão arquivada com sucesso.');
    expect(component.suggestions().find(s => s.id === item.id)?.status).toBe('arquivada');
    expect(component.archiveDialogVisible()).toBe(false);
  });

  it('should keep action buttons disabled if response is empty', () => {
    const item = mockSuggestions[0];
    component.toggleExpand(item);

    component.responseForm.controls.response.setValue('');
    expect(component.responseForm.invalid).toBe(true);
  });

  it('should handle invalid_status_transition error by showing toast and reloading', () => {
    const item = mockSuggestions[1];
    apiMock.respond.mockReturnValue(throwError(() => ({
      status: 400,
      message: 'Bad Request',
      details: { code: 'invalid_status_transition' }
    })));

    component.toggleExpand(item);
    component.responseForm.controls.response.setValue('Nova resposta');
    apiMock.listCitySuggestions.mockClear();

    component.submitRespond(item);

    expect(toastMock.show).toHaveBeenCalledWith('error', 'Não é possível arquivar/concluir uma sugestão sem resposta.');
    expect(apiMock.listCitySuggestions).toHaveBeenCalled();
  });

  it('should handle not_owner_or_admin error by showing toast and navigating', () => {
    const item = mockSuggestions[1];
    apiMock.respond.mockReturnValue(throwError(() => ({
      status: 403,
      message: 'Forbidden',
      details: { code: 'not_owner_or_admin' }
    })));

    component.toggleExpand(item);
    component.responseForm.controls.response.setValue('Nova resposta');

    component.submitRespond(item);

    expect(toastMock.show).toHaveBeenCalledWith('error', 'Você não tem permissão para esta sugestão.');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/sugestoes']);
  });

  describe('Helpers and Mappings', () => {
    it('should format date with time correctly', () => {
      expect(component.formatDate(null)).toBe('');
      expect(component.formatDate(undefined)).toBe('');

      const iso = '2026-04-22T10:05:00Z';
      const expectedDate = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      const expected = `22 abr ${pad(expectedDate.getHours())}:${pad(expectedDate.getMinutes())}`;

      expect(component.formatDate(iso)).toBe(expected);
    });

    it('should filter suggestions by user name', () => {
      component.searchQuery.set('Rafael');
      expect(component.filteredSuggestions().length).toBe(1);
      expect(component.filteredSuggestions()[0].id).toBe('sgt_002');
    });
  });

  describe('Selection & Bulk Actions', () => {
    it('should toggle selection for individual items and all items', () => {
      const mockEvent = { stopPropagation: vi.fn() } as any;
      component.toggleSelect('sgt_001', mockEvent);
      expect(component.selectedIds().has('sgt_001')).toBe(true);

      component.toggleSelect('sgt_001', mockEvent);
      expect(component.selectedIds().has('sgt_001')).toBe(false);

      const selectAllEvent = { target: { checked: true } } as any;
      component.toggleSelectAll(selectAllEvent);
      expect(component.selectedIds().size).toBe(5);

      const deselectAllEvent = { target: { checked: false } } as any;
      component.toggleSelectAll(deselectAllEvent);
      expect(component.selectedIds().size).toBe(0);
    });

    it('should execute marcarComoLidas and update local status', () => {
      const mockEvent = { stopPropagation: vi.fn() } as any;
      component.toggleSelect('sgt_001', mockEvent);

      const updated = { ...mockSuggestions[0], status: 'lida' };
      apiMock.getSuggestionDetail.mockReturnValue(of(updated));

      component.marcarComoLidas();

      expect(apiMock.getSuggestionDetail).toHaveBeenCalledWith('sgt_001');
      expect(component.suggestions().find(s => s.id === 'sgt_001')?.status).toBe('lida');
      expect(component.selectedIds().size).toBe(0);
      expect(toastMock.show).toHaveBeenCalledWith('success', '1 sugestões marcadas como lidas.');
    });

    it('should execute executeBulkArchive and update status', () => {
      const mockEvent = { stopPropagation: vi.fn() } as any;
      component.toggleSelect('sgt_001', mockEvent);
      component.toggleSelect('sgt_002', mockEvent);

      const updated1 = { ...mockSuggestions[0], status: 'arquivada' };
      const updated2 = { ...mockSuggestions[1], status: 'arquivada' };

      apiMock.archive
        .mockReturnValueOnce(of(updated1))
        .mockReturnValueOnce(of(updated2));

      component.confirmBulkArchive();
      expect(component.bulkArchiveDialogVisible()).toBe(true);

      component.executeBulkArchive();

      expect(apiMock.archive).toHaveBeenCalledWith('sgt_001', 'Sugestão arquivada.');
      expect(apiMock.archive).toHaveBeenCalledWith('sgt_002', 'Sugestão arquivada.');
      expect(component.suggestions().find(s => s.id === 'sgt_001')?.status).toBe('arquivada');
      expect(component.suggestions().find(s => s.id === 'sgt_002')?.status).toBe('arquivada');
      expect(component.selectedIds().size).toBe(0);
      expect(component.bulkArchiveDialogVisible()).toBe(false);
      expect(toastMock.show).toHaveBeenCalledWith('success', '2 sugestões arquivadas com sucesso.');
    });
  });
});
