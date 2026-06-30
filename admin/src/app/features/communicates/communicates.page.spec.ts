import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CommunicatesPage } from './communicates.page';
import { ComunicadosApi } from './communicates.api';
import { ComunicadoItem } from './communicates.model';
import { ToastService } from '../../core/services/toast.service';

const items: ComunicadoItem[] = [
  {
    id: 'com_1',
    title: 'Comunicado ativo',
    description: 'Descrição do comunicado ativo',
    isActive: true,
    photos: [],
  },
  {
    id: 'com_2',
    title: 'Comunicado inativo',
    description: 'Descrição do comunicado inativo',
    isActive: false,
    photos: [],
  },
];

describe('CommunicatesPage', () => {
  let fixture: ComponentFixture<CommunicatesPage>;
  let component: CommunicatesPage;
  let el: HTMLElement;

  const api = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const toast = {
    show: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  const activatedRoute = {
    snapshot: {
      queryParamMap: {
        get: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    activatedRoute.snapshot.queryParamMap.get.mockReturnValue(null);

    api.list.mockReturnValue(
      of({
        items,
        total: items.length,
        page: 1,
        pageSize: 10,
      }),
    );
    api.create.mockReturnValue(of(items[0]));
    api.update.mockReturnValue(of(items[1]));
    api.delete.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [CommunicatesPage],
      providers: [
        { provide: ComunicadosApi, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunicatesPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('deve listar comunicados via DataList', () => {
    expect(api.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      filters: { isActive: undefined },
    });

    expect(el.textContent).toContain('Comunicado ativo');
    expect(el.textContent).toContain('Comunicado inativo');
  });

  it('deve criar comunicado pelo modal', () => {
    component['openCreate']();
    component['updateForm']('title', 'Novo comunicado');
    component['updateForm']('description', 'Descrição válida do comunicado');

    component['save']();

    expect(api.create).toHaveBeenCalledWith({
      title: 'Novo comunicado',
      description: 'Descrição válida do comunicado',
      isActive: true,
    });
    expect(toast.show).toHaveBeenCalledWith('success', 'Comunicado criado com sucesso.');
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('deve editar comunicado usando update PATCH', () => {
    component['openEdit'](items[0]);
    component['updateForm']('title', 'Título editado');
    component['updateForm']('description', 'Descrição editada válida');

    component['save']();

    expect(api.update).toHaveBeenCalledWith('com_1', {
      title: 'Título editado',
      description: 'Descrição editada válida',
      isActive: true,
    });
    expect(toast.show).toHaveBeenCalledWith('success', 'Comunicado atualizado com sucesso.');
  });

  it('deve marcar comunicado como inativo', () => {
    component['openEdit'](items[0]);
    component['updateForm']('isActive', false);

    component['saveAs'](false);

    expect(api.update).toHaveBeenCalledWith('com_1', {
      title: 'Comunicado ativo',
      description: 'Descrição do comunicado ativo',
      isActive: false,
    });
  });

  it('deve tratar comunicado_not_found no update', () => {
    api.update.mockReturnValueOnce(
      throwError(() => ({
        error: {
          code: 'comunicado_not_found',
        },
      })),
    );

    component['openEdit'](items[0]);
    component['updateForm']('title', 'Título editado');
    component['updateForm']('description', 'Descrição editada válida');

    component['save']();

    expect(toast.show).toHaveBeenCalledWith(
      'error',
      'Comunicado não encontrado. Pode ter sido excluído por outro admin.',
    );
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('deve persistir filtro isActive na query string', () => {
    component['isActive'].set('false');

    component['applyFilters']();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: { isActive: 'false' },
      queryParamsHandling: 'merge',
    });

    expect(api.list).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      filters: { isActive: false },
    });
  });
});
