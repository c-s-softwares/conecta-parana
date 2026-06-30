import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsPage } from './news.page';
import { NewsApi } from './news.api';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppError } from '../../core/interceptors/app-error';
import { NewsItem } from './news.model';

describe('NewsPage', () => {
  let component: NewsPage;
  let fixture: ComponentFixture<NewsPage>;

  const newsApiMock = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const toastServiceMock = {
    show: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    newsApiMock.list.mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 10 }));

    await TestBed.configureTestingModule({
      imports: [NewsPage, ReactiveFormsModule],
      providers: [
        { provide: NewsApi, useValue: newsApiMock },
        { provide: ToastService, useValue: toastServiceMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create news with linkType = interno', () => {
    newsApiMock.create.mockReturnValue(of({ id: 'nws_1' } as unknown as NewsItem));

    component.openForm();
    component['form'].patchValue({
      title: 'Título da Notícia Interna',
      description: 'Descrição longa o suficiente para passar na validação de 10 caracteres.',
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });

    component.onSubmit();

    expect(newsApiMock.create).toHaveBeenCalledWith({
      title: 'Título da Notícia Interna',
      description: 'Descrição longa o suficiente para passar na validação de 10 caracteres.',
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });
    expect(toastServiceMock.show).toHaveBeenCalledWith('success', 'Notícia criada com sucesso.');
  });

  it('should create news with linkType = externo and verify externalUrl is NOT sent in payload', () => {
    newsApiMock.create.mockReturnValue(of({ id: 'nws_2' } as unknown as NewsItem));

    component.openForm();
    component['form'].patchValue({
      title: 'Título da Notícia Externa',
      description: 'Descrição longa o suficiente para passar na validação de 10 caracteres.',
      type: 'geral',
      linkType: 'externo',
      externalUrl: 'https://exemplo.com',
      isActive: true,
    });

    component.onSubmit();

    expect(newsApiMock.create).toHaveBeenCalledWith({
      title: 'Título da Notícia Externa',
      description: 'Descrição longa o suficiente para passar na validação de 10 caracteres.',
      type: 'geral',
      linkType: 'externo',
      isActive: true,
    });
    expect(toastServiceMock.show).toHaveBeenCalledWith('success', 'Notícia criada com sucesso.');
  });

  it('should handle invalid_type error from API', () => {
    const apiError: AppError = {
      status: 400,
      message: 'Bad Request',
      details: {
        code: 'invalid_type',
        message: 'Tipo de notícia inválido.',
      },
    };

    newsApiMock.create.mockReturnValue(throwError(() => apiError));

    component.openForm();
    component['form'].patchValue({
      title: 'Título da Notícia',
      description: 'Descrição longa o suficiente para passar na validação de 10 caracteres.',
      type: 'saude',
      linkType: 'interno',
      isActive: true,
    });

    component.onSubmit();

    expect(component['typeError']).toBe('Tipo de notícia inválido.');
    expect(component['form'].controls.type.hasError('invalid')).toBe(true);
  });
});
