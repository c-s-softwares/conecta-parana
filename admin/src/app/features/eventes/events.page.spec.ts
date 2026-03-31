import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { EventsPage } from './events.page';
import { ApiService } from '../../core/services/api.service';
import { of } from 'rxjs';

describe('EventsPage', () => {
  let fixture: ComponentFixture<EventsPage>;
  let component: EventsPage;
  let el: HTMLElement;
  let apiService: ApiService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [EventsPage, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsPage);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Renderização inicial ──────────────────────────────────────────────────

  it('deve criar com view "list" e renderizar page-header', () => {
    expect(component).toBeTruthy();
    expect(component.view()).toBe('list');
    expect(el.querySelector('app-page-header')).toBeTruthy();
    expect(el.querySelector('app-form-container')).toBeNull();
  });

  // ─── openForm / closeForm ─────────────────────────────────────────────────

  describe('openForm / closeForm', () => {
    it('deve abrir formulário, resetar valores e limpar fotos', () => {
      component['form'].patchValue({ title: 'editado', type: 'cultural' });
      component['photos'].set([new File([''], 'foto.jpg', { type: 'image/jpeg' })]);

      component.openForm();
      fixture.detectChanges();

      expect(component.view()).toBe('form');
      expect(component['form'].controls.title.value).toBe('');
      expect(component['photos']()).toHaveLength(0);
      expect(component['photoErrors']()).toHaveLength(0);
      expect(el.querySelector('app-form-container')).toBeTruthy();
    });

    it('deve fechar formulário e voltar para list', () => {
      component.openForm();
      component.closeForm();
      expect(component.view()).toBe('list');
    });
  });

  // ─── defaultFormValues ────────────────────────────────────────────────────

  describe('defaultFormValues', () => {
    it('deve retornar valores padrão corretos', () => {
      expect(component['defaultFormValues']()).toEqual({
        title: '',
        type: '',
        description: '',
        event_date: '',
        category_id: '',
        latitude: null,
        longitude: null,
        local_id: '',
      });
    });
  });

  // ─── titleError / titleTouched ────────────────────────────────────────────

  describe('titleError / titleTouched', () => {
    it('deve retornar required quando vazio', () => {
      const ctrl = component['form'].controls.title;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.titleTouched).toBe(true);
      expect(component.titleError).toBe('Título é obrigatório.');
    });

    it('deve retornar erro de minlength quando muito curto', () => {
      const ctrl = component['form'].controls.title;
      ctrl.setValue('ab');
      ctrl.markAsTouched();
      expect(component.titleError).toBe('Título deve ter no mínimo 3 caracteres.');
    });

    it('deve retornar erro de maxlength quando muito longo', () => {
      const ctrl = component['form'].controls.title;
      ctrl.setValue('a'.repeat(201));
      ctrl.markAsTouched();
      expect(component.titleError).toBe('Título deve ter no máximo 200 caracteres.');
    });

    it('deve retornar string vazia quando válido', () => {
      const ctrl = component['form'].controls.title;
      ctrl.setValue('Título válido');
      ctrl.markAsTouched();
      expect(component.titleError).toBe('');
    });
  });

  // ─── typeError / typeTouched ──────────────────────────────────────────────

  describe('typeError / typeTouched', () => {
    it('deve retornar required quando não selecionado', () => {
      const ctrl = component['form'].controls.type;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.typeTouched).toBe(true);
      expect(component.typeError).toBe('Tipo é obrigatório.');
    });

    it('deve retornar string vazia quando selecionado', () => {
      component['form'].controls.type.setValue('cultural');
      expect(component.typeError).toBe('');
    });
  });

  // ─── descriptionError / descriptionTouched ────────────────────────────────

  describe('descriptionError / descriptionTouched', () => {
    it('deve retornar required quando vazio', () => {
      const ctrl = component['form'].controls.description;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.descriptionTouched).toBe(true);
      expect(component.descriptionError).toBe('Descrição é obrigatória.');
    });

    it('deve retornar erro de minlength quando texto muito curto', () => {
      const ctrl = component['form'].controls.description;
      ctrl.setValue('curto');
      ctrl.markAsTouched();
      expect(component.descriptionError).toBe('Descrição deve ter no mínimo 10 caracteres.');
    });

    it('deve retornar string vazia quando válido', () => {
      component['form'].controls.description.setValue('Uma descrição longa o suficiente');
      expect(component.descriptionError).toBe('');
    });
  });

  // ─── eventDateError / eventDateTouched ────────────────────────────────────

  describe('eventDateError / eventDateTouched', () => {
    it('deve retornar erro de pastDate para data no passado', () => {
      const ctrl = component['form'].controls.event_date;
      ctrl.setValue('2000-01-01T10:00');
      ctrl.markAsTouched();
      expect(component.eventDateTouched).toBe(true);
      expect(component.eventDateError).toBe('A data do evento deve ser futura.');
    });

    it('deve retornar string vazia para data futura', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const iso = future.toISOString().slice(0, 16);
      component['form'].controls.event_date.setValue(iso);
      expect(component.eventDateError).toBe('');
    });

    it('deve aceitar campo vazio sem erro (não obrigatório)', () => {
      component['form'].controls.event_date.setValue('');
      expect(component.eventDateError).toBe('');
    });
  });

  // ─── latitudeError / latitudeTouched ─────────────────────────────────────

  describe('latitudeError / latitudeTouched', () => {
    it('deve retornar erro para latitude abaixo de -90', () => {
      const ctrl = component['form'].controls.latitude;
      ctrl.setValue(-91);
      ctrl.markAsTouched();
      expect(component.latitudeTouched).toBe(true);
      expect(component.latitudeError).toBe('Latitude deve estar entre -90 e 90.');
    });

    it('deve retornar erro para latitude acima de 90', () => {
      component['form'].controls.latitude.setValue(91);
      expect(component.latitudeError).toBe('Latitude deve estar entre -90 e 90.');
    });

    it('deve retornar string vazia para valor válido', () => {
      component['form'].controls.latitude.setValue(-23.4253);
      expect(component.latitudeError).toBe('');
    });

    it('deve aceitar null sem erro (não obrigatório)', () => {
      component['form'].controls.latitude.setValue(null);
      expect(component.latitudeError).toBe('');
    });
  });

  // ─── longitudeError / longitudeTouched ────────────────────────────────────

  describe('longitudeError / longitudeTouched', () => {
    it('deve retornar erro para longitude abaixo de -180', () => {
      const ctrl = component['form'].controls.longitude;
      ctrl.setValue(-181);
      ctrl.markAsTouched();
      expect(component.longitudeTouched).toBe(true);
      expect(component.longitudeError).toBe('Longitude deve estar entre -180 e 180.');
    });

    it('deve retornar erro para longitude acima de 180', () => {
      component['form'].controls.longitude.setValue(181);
      expect(component.longitudeError).toBe('Longitude deve estar entre -180 e 180.');
    });

    it('deve retornar string vazia para valor válido', () => {
      component['form'].controls.longitude.setValue(-51.9383);
      expect(component.longitudeError).toBe('');
    });

    it('deve aceitar null sem erro (não obrigatório)', () => {
      component['form'].controls.longitude.setValue(null);
      expect(component.longitudeError).toBe('');
    });
  });

  // ─── processFiles / onPhotosSelected / onDrop ─────────────────────────────

  describe('processFiles', () => {
    it('deve aceitar arquivos jpg, png e webp válidos', () => {
      const files = [
        new File(['x'], 'foto1.jpg', { type: 'image/jpeg' }),
        new File(['x'], 'foto2.png', { type: 'image/png' }),
        new File(['x'], 'foto3.webp', { type: 'image/webp' }),
      ];
      component['processFiles'](files);

      expect(component['photos']()).toHaveLength(3);
      expect(component['photoErrors']()).toHaveLength(0);
    });

    it('deve rejeitar arquivo com formato inválido', () => {
      const files = [new File(['x'], 'doc.pdf', { type: 'application/pdf' })];
      component['processFiles'](files);

      expect(component['photos']()).toHaveLength(0);
      expect(component['photoErrors']()[0]).toContain('formato inválido');
    });

    it('deve rejeitar arquivo acima de 5MB', () => {
      const big = new File([new ArrayBuffer(6 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' });
      component['processFiles']([big]);

      expect(component['photos']()).toHaveLength(0);
      expect(component['photoErrors']()[0]).toContain('5MB');
    });

    it('deve acumular fotos válidas em chamadas subsequentes', () => {
      component['processFiles']([new File(['x'], 'a.jpg', { type: 'image/jpeg' })]);
      component['processFiles']([new File(['x'], 'b.png', { type: 'image/png' })]);

      expect(component['photos']()).toHaveLength(2);
    });

    it('deve sobrescrever erros anteriores a cada nova chamada', () => {
      component['processFiles']([new File(['x'], 'ruim.gif', { type: 'image/gif' })]);
      expect(component['photoErrors']()).toHaveLength(1);

      component['processFiles']([new File(['x'], 'bom.jpg', { type: 'image/jpeg' })]);
      expect(component['photoErrors']()).toHaveLength(0);
    });
  });

  describe('removePhoto', () => {
    it('deve remover foto pelo índice', () => {
      component['photos'].set([
        new File([''], 'a.jpg', { type: 'image/jpeg' }),
        new File([''], 'b.jpg', { type: 'image/jpeg' }),
        new File([''], 'c.jpg', { type: 'image/jpeg' }),
      ]);
      component.removePhoto(1);

      const names = component['photos']().map(f => f.name);
      expect(names).toEqual(['a.jpg', 'c.jpg']);
    });
  });

  describe('onDragOver', () => {
    it('deve chamar preventDefault', () => {
      const event = { preventDefault: vi.fn() } as unknown as DragEvent;
      component.onDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ─── onSubmit ─────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('deve marcar todos os campos como touched e não chamar api quando inválido', () => {
      const spy = vi.spyOn(apiService, 'create');
      component.openForm();
      component.onSubmit();

      expect(component['form'].controls.title.touched).toBe(true);
      expect(component['form'].controls.type.touched).toBe(true);
      expect(component['form'].controls.description.touched).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve chamar api com dados corretos e voltar para list quando válido', () => {
      const spy = vi.spyOn(apiService, 'create').mockReturnValue(of({}));
      component.openForm();

      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);

      component['form'].patchValue({
        title: 'Evento Teste',
        type: 'cultural',
        description: 'Descrição longa o suficiente para passar na validação',
        event_date: future.toISOString().slice(0, 16),
        latitude: -23.4253,
        longitude: -51.9383,
      });

      const fotos = [new File(['x'], 'foto.jpg', { type: 'image/jpeg' })];
      component['photos'].set(fotos);

      component.onSubmit();

      expect(spy).toHaveBeenCalledWith('events', expect.objectContaining({
        title: 'Evento Teste',
        type: 'cultural',
        description: 'Descrição longa o suficiente para passar na validação',
        photos: fotos,
      }));
      expect(component.view()).toBe('list');
    });

    it('deve enviar com fotos vazias quando nenhuma foto adicionada', () => {
      const spy = vi.spyOn(apiService, 'create').mockReturnValue(of({}));
      component.openForm();
      component['form'].patchValue({
        title: 'Evento Sem Fotos',
        type: 'esportivo',
        description: 'Descrição mínima válida aqui',
      });
      component.onSubmit();

      expect(spy).toHaveBeenCalledWith('events', expect.objectContaining({ photos: [] }));
    });

    it('deve enviar campos opcionais como null/vazio quando não preenchidos', () => {
      const spy = vi.spyOn(apiService, 'create').mockReturnValue(of({}));
      component.openForm();
      component['form'].patchValue({
        title: 'Evento Mínimo',
        type: 'saude',
        description: 'Descrição com tamanho mínimo válido',
      });
      component.onSubmit();

      expect(spy).toHaveBeenCalledWith('events', expect.objectContaining({
        event_date: '',
        category_id: '',
        latitude: null,
        longitude: null,
        local_id: '',
      }));
    });
  });

  // ─── eventTypes ───────────────────────────────────────────────────────────

  describe('eventTypes', () => {
    it('deve conter os tipos esperados', () => {
      const values = component.eventTypes.map(t => t.value);
      expect(values).toContain('cultural');
      expect(values).toContain('esportivo');
      expect(values).toContain('saude');
      expect(values).toContain('educacao');
      expect(values).toContain('tecnologia');
      expect(values).toContain('lazer');
    });
  });

  // ─── validação do formulário ──────────────────────────────────────────────

  describe('validação do formulário', () => {
    it('deve estar inválido sem os campos obrigatórios', () => {
      expect(component['form'].valid).toBe(false);
    });

    it('deve ser válido com título, tipo e descrição preenchidos', () => {
      component['form'].patchValue({
        title: 'Título válido',
        type: 'cultural',
        description: 'Descrição longa o suficiente',
      });
      expect(component['form'].valid).toBe(true);
    });

    it('deve rejeitar latitude e longitude fora do intervalo', () => {
      component['form'].patchValue({ latitude: 999, longitude: -999 });
      expect(component['form'].controls.latitude.valid).toBe(false);
      expect(component['form'].controls.longitude.valid).toBe(false);
    });

    it('deve aceitar latitude e longitude nos limites', () => {
      component['form'].patchValue({ latitude: 90, longitude: -180 });
      expect(component['form'].controls.latitude.valid).toBe(true);
      expect(component['form'].controls.longitude.valid).toBe(true);
    });
  });
});
