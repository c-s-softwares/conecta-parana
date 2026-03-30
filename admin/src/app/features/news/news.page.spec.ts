import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Validators } from '@angular/forms';
import { NewsPage } from './news.page';
import { ApiService } from '../../core/services/api.service';
import { of } from 'rxjs';

describe('NewsPage', () => {
  let fixture: ComponentFixture<NewsPage>;
  let component: NewsPage;
  let el: HTMLElement;
  let apiService: ApiService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [NewsPage, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsPage);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criar com view "list", linkType "external" e renderizar page-header', () => {
    expect(component).toBeTruthy();
    expect(component.view()).toBe('list');
    expect(component['linkType']()).toBe('external');
    expect(el.querySelector('app-page-header')).toBeTruthy();
    expect(el.querySelector('app-form-container')).toBeNull();
  });

  describe('openForm / closeForm', () => {
    it('deve abrir formulário, resetar valores e renderizar form-container', () => {
      component['form'].patchValue({ title: 'editado' });
      component['linkType'].set('internal');

      component.openForm();
      fixture.detectChanges();

      expect(component.view()).toBe('form');
      expect(component['linkType']()).toBe('external');
      expect(component['form'].controls.title.value).toBe('');
      expect(el.querySelector('app-form-container')).toBeTruthy();
    });

    it('deve fechar formulário e voltar para list', () => {
      component.openForm();
      component.closeForm();
      expect(component.view()).toBe('list');
    });
  });

  describe('defaultFormValues', () => {
    it('deve retornar valores default com isActive true e linkType external', () => {
      expect(component['defaultFormValues']()).toEqual({
        title: '',
        description: '',
        linkType: 'external',
        linkUrl: '',
        isActive: true,
      });
    });
  });

  describe('titleError / titleTouched', () => {
    it('deve retornar required quando vazio, specialChars quando inválido, vazio quando válido', () => {
      const ctrl = component['form'].controls.title;

      expect(component.titleTouched).toBe(false);
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.titleTouched).toBe(true);
      expect(component.titleError).toBe('Título é obrigatório.');

      ctrl.setValue('titulo@invalido');
      expect(component.titleError).toBe('Título não pode conter caracteres especiais.');

      ctrl.setValue('Título válido');
      expect(component.titleError).toBe('');
    });
  });

  describe('descriptionError / descriptionTouched', () => {
    it('deve retornar erro quando vazio e vazio quando preenchido', () => {
      const ctrl = component['form'].controls.description;

      expect(component.descriptionTouched).toBe(false);
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.descriptionTouched).toBe(true);
      expect(component.descriptionError).toBe('Descrição é obrigatória.');

      ctrl.setValue('Uma descrição');
      expect(component.descriptionError).toBe('');
    });
  });

  describe('urlError / linkUrlTouched', () => {
    beforeEach(() => {
      const ctrl = component['form'].controls.linkUrl;
      ctrl.setValidators([Validators.required, Validators.pattern(/^https:\/\//)]);
    });

    it('deve retornar required quando vazio, pattern quando http, vazio quando válido', () => {
      const ctrl = component['form'].controls.linkUrl;

      expect(component.linkUrlTouched).toBe(false);
      ctrl.setValue('');
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
      expect(component.linkUrlTouched).toBe(true);
      expect(component.urlError).toBe('Url é obrigatória.');

      ctrl.setValue('http://invalido.com');
      ctrl.updateValueAndValidity();
      expect(component.urlError).toBe('Url da notícia inválida: necessário começar com "https://"');

      ctrl.setValue('https://valido.com');
      ctrl.updateValueAndValidity();
      expect(component.urlError).toBe('');
    });
  });

  describe('onLinkTypeChange', () => {
    it('deve sincronizar signal e resetar linkUrl', () => {
      component['form'].controls.linkUrl.setValue('https://teste.com');

      component['form'].controls.linkType.setValue('internal');
      component.onLinkTypeChange();
      expect(component['linkType']()).toBe('internal');
      expect(component['form'].controls.linkUrl.value).toBe('');

      component['form'].controls.linkType.setValue('external');
      component.onLinkTypeChange();
      expect(component['linkType']()).toBe('external');
    });
  });

  describe('onSubmit', () => {
    it('deve marcar touched e não chamar api se inválido', () => {
      const spy = vi.spyOn(apiService, 'create');
      component.openForm();
      component.onSubmit();

      expect(component['form'].controls.title.touched).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve chamar api com dados corretos para link externo', () => {
      const spy = vi.spyOn(apiService, 'create').mockReturnValue(of({}));
      component.openForm();
      component['form'].patchValue({
        title: 'Teste',
        description: 'Desc',
        linkType: 'external',
        linkUrl: 'https://teste.com',
      });
      component.onSubmit();

      expect(spy).toHaveBeenCalledWith('news', expect.objectContaining({
        title: 'Teste',
        linkType: 'external',
        linkUrl: 'https://teste.com',
      }));
      expect(component.view()).toBe('list');
    });

    it('deve gerar slug automaticamente para link interno', () => {
      const spy = vi.spyOn(apiService, 'create').mockReturnValue(of({}));
      component.openForm();
      component['linkType'].set('internal');
      component['form'].patchValue({
        title: 'Notícia Legal',
        description: 'Desc',
        linkType: 'internal',
      });
      component.onSubmit();

      expect(spy).toHaveBeenCalledWith('news', expect.objectContaining({ linkUrl: '/noticia-legal' }));
      expect(component['form'].controls.linkUrl.errors).toBeNull();
    });

    it('deve adicionar required ao linkUrl quando external e rejeitar http://', () => {
      const spy = vi.spyOn(apiService, 'create');
      component.openForm();
      component['form'].patchValue({
        title: 'Teste',
        description: 'Desc',
        linkType: 'external',
        linkUrl: '',
      });
      component.onSubmit();
      expect(component['form'].controls.linkUrl.hasError('required')).toBe(true);

      component['form'].controls.linkUrl.setValue('http://invalido.com');
      component.onSubmit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('generateSlugPreview', () => {
    it('deve gerar slug sem acentos', () => {
      expect(component['generateSlugPreview']('Teste Legal')).toBe('/teste-legal');
      expect(component['generateSlugPreview']('Notícia')).toBe('/noticia');
    });
  });

  describe('validação do formulário', () => {
    it('deve validar campos required e aceitar valores válidos', () => {
      const { title, description, isActive } = component['form'].controls;

      expect(title.valid).toBe(false);
      title.setValue('Título válido');
      expect(title.valid).toBe(true);
      title.setValue('titulo@errado');
      expect(title.valid).toBe(false);

      expect(description.valid).toBe(false);
      description.setValue('Uma descrição');
      expect(description.valid).toBe(true);

      expect(isActive.value).toBe(true);
    });
  });
});
