import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { NewsFormModal } from './news-form-modal';
import { NewsApi } from './news.api';
import { UploadsApi } from '../../core/services/uploads.api';
import { ToastService } from '../../core/services/toast.service';
import { NewsItem } from './news.model';

const NEWS_ID = 'nws_created';
const EXTERNAL_URL = 'https://exemplo.com/noticia';

const CREATED_ITEM: NewsItem = {
  id: NEWS_ID,
  title: 'Título de Teste',
  description: 'Descrição longa o suficiente para passar na validação.',
  type: 'saude',
  linkType: 'interno',
  isActive: true,
  photos: [],
};

describe('NewsFormModal', () => {
  let component: NewsFormModal;
  let fixture: ComponentFixture<NewsFormModal>;

  const newsApiMock = {
    create: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  };

  const uploadsApiMock = {
    upload: vi.fn(),
    remove: vi.fn(),
  };

  const toastServiceMock = {
    show: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    newsApiMock.get.mockReturnValue(of({ ...CREATED_ITEM, photos: [] }));

    await TestBed.configureTestingModule({
      imports: [NewsFormModal],
      providers: [
        { provide: NewsApi, useValue: newsApiMock },
        { provide: UploadsApi, useValue: uploadsApiMock },
        { provide: ToastService, useValue: toastServiceMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsFormModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('news', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create news with linkType=interno (sem linkUrl no payload)', () => {
    newsApiMock.create.mockReturnValue(of(CREATED_ITEM));

    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });

    component['onSubmit']();

    expect(newsApiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: CREATED_ITEM.title,
        linkType: 'interno',
      }),
    );
    expect(newsApiMock.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ linkUrl: expect.anything() }),
    );
  });

  it('should create news with linkType=externo and include linkUrl in payload', () => {
    newsApiMock.create.mockReturnValue(
      of({ ...CREATED_ITEM, linkType: 'externo', linkUrl: EXTERNAL_URL }),
    );

    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'geral',
      linkType: 'externo',
      linkUrl: EXTERNAL_URL,
      isActive: true,
    });

    component['onSubmit']();

    expect(newsApiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        linkType: 'externo',
        linkUrl: EXTERNAL_URL,
      }),
    );
  });

  it('should block submit when linkType=externo and linkUrl is empty', () => {
    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'geral',
      linkType: 'externo',
      linkUrl: '',
      isActive: true,
    });

    component['onSubmit']();

    expect(newsApiMock.create).not.toHaveBeenCalled();
    expect(component['form'].get('linkUrl')?.invalid).toBe(true);
  });

  it('should block submit when linkType=externo and linkUrl is invalid', () => {
    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'geral',
      linkType: 'externo',
      linkUrl: 'nao-e-uma-url',
      isActive: true,
    });

    component['onSubmit']();

    expect(newsApiMock.create).not.toHaveBeenCalled();
    expect(component['form'].get('linkUrl')?.errors?.['url']).toBe(true);
  });

  it('should set serverType error on invalid_type API response', () => {
    newsApiMock.create.mockReturnValue(
      throwError(() => ({
        status: 400,
        message: 'Bad Request',
        details: { code: 'invalid_type' },
      })),
    );

    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });

    component['onSubmit']();

    expect(component['form'].get('type')?.errors?.['serverType']).toBe(true);
  });

  it('deve chamar api.update no modo de edição', () => {
    newsApiMock.update.mockReturnValue(of({ ...CREATED_ITEM, title: 'Editado' }));

    fixture.componentRef.setInput('news', CREATED_ITEM);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    component['onSubmit']();

    expect(newsApiMock.update).toHaveBeenCalledWith(
      NEWS_ID,
      expect.objectContaining({ title: CREATED_ITEM.title, linkType: 'interno' }),
    );
  });

  it('deve emitir closed quando api.get falha no initialize', () => {
    newsApiMock.get.mockReturnValue(throwError(() => new Error('not found')));

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentRef.setInput('news', CREATED_ITEM);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('deve definir serverLinkType quando API retorna invalid_link_type', () => {
    newsApiMock.create.mockReturnValue(
      throwError(() => ({
        status: 400,
        details: { code: 'invalid_link_type' },
      })),
    );

    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });

    component['onSubmit']();

    expect(component['form'].get('linkType')?.errors?.['serverLinkType']).toBe(true);
  });

  it('deve emitir closed quando API retorna 403', () => {
    newsApiMock.create.mockReturnValue(
      throwError(() => ({ status: 403, details: null })),
    );

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });

    component['onSubmit']();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('deve definir erro de url quando validation_failed menciona linkUrl', () => {
    newsApiMock.create.mockReturnValue(
      throwError(() => ({
        status: 400,
        details: {
          code: 'validation_failed',
          message: ['linkUrl must be a URL address'],
        },
      })),
    );

    component['form'].patchValue({
      title: CREATED_ITEM.title,
      description: CREATED_ITEM.description,
      type: 'geral',
      linkType: 'externo',
      linkUrl: EXTERNAL_URL,
      isActive: true,
    });

    component['onSubmit']();

    expect(component['form'].get('linkUrl')?.errors?.['url']).toBe(true);
  });
});
