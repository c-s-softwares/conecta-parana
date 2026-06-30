import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsPage } from './news.page';
import { NewsApi } from './news.api';
import { ToastService } from '../../core/services/toast.service';
import { UploadsApi } from '../../core/services/uploads.api';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppError } from '../../core/interceptors/app-error';
import { NewsItem } from './news.model';

const NEWS_ID = 'nws_1';

const NEWS_ITEM: NewsItem = {
  id: NEWS_ID,
  title: 'Título da Notícia',
  description: 'Descrição longa o suficiente',
  type: 'saude',
  linkType: 'interno',
  isActive: true,
  photos: [],
};

describe('NewsPage', () => {
  let component: NewsPage;
  let fixture: ComponentFixture<NewsPage>;

  const newsApiMock = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  };

  const toastServiceMock = {
    show: vi.fn(),
  };

  const uploadsApiMock = {
    upload: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    newsApiMock.list.mockReturnValue(
      of({ items: [NEWS_ITEM], total: 1, page: 1, pageSize: 10 }),
    );

    await TestBed.configureTestingModule({
      imports: [NewsPage, ReactiveFormsModule],
      providers: [
        { provide: NewsApi, useValue: newsApiMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: UploadsApi, useValue: uploadsApiMock },
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

  it('should load news on init', () => {
    expect(newsApiMock.list).toHaveBeenCalled();
    expect(component.items()).toHaveLength(1);
    expect(component.totalItems()).toBe(1);
  });

  it('should open create form with no selected item', () => {
    component.openCreate();
    expect(component.formOpen()).toBe(true);
    expect(component.selectedItem()).toBeNull();
  });

  it('should open edit form with the selected item', () => {
    component.openEdit(NEWS_ITEM);
    expect(component.formOpen()).toBe(true);
    expect(component.selectedItem()).toEqual(NEWS_ITEM);
  });

  it('should close form and reload on saved', () => {
    component.openEdit(NEWS_ITEM);
    component.onFormSaved();
    expect(component.formOpen()).toBe(false);
    expect(component.selectedItem()).toBeNull();
    expect(newsApiMock.list).toHaveBeenCalledTimes(2);
  });

  it('should close form on cancelled', () => {
    component.openCreate();
    component.onFormClosed();
    expect(component.formOpen()).toBe(false);
  });

  it('should show success toast and reload after delete', () => {
    newsApiMock.delete.mockReturnValue(of(undefined));
    component.confirmDelete(NEWS_ITEM);
    component.executeDelete();
    expect(newsApiMock.delete).toHaveBeenCalledWith(NEWS_ID);
    expect(toastServiceMock.show).toHaveBeenCalledWith(
      'success',
      'Notícia excluída com sucesso.',
    );
  });

  it('should show error toast on 404 delete', () => {
    const apiError: AppError = {
      status: 404,
      message: 'Not Found',
      details: null,
    };
    newsApiMock.delete.mockReturnValue(throwError(() => apiError));
    component.confirmDelete(NEWS_ITEM);
    component.executeDelete();
    expect(toastServiceMock.show).toHaveBeenCalledWith(
      'error',
      'Notícia não encontrada. Pode ter sido excluída por outro admin.',
    );
  });
});
