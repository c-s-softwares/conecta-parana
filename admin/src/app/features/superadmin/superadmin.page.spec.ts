import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SuperadminPage } from './superadmin.page';

describe('SuperadminPage', () => {
  let fixture: ComponentFixture<SuperadminPage>;
  let component: SuperadminPage;
  let el: HTMLElement;
  let apiService: ApiService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [SuperadminPage, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperadminPage);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criar a página com view list', () => {
    expect(component).toBeTruthy();
    expect(component.view()).toBe('list');
    expect(el.querySelector('app-page-header')).toBeTruthy();
  });

  it('deve abrir o formulário ao chamar openForm', () => {
    component.openForm();
    fixture.detectChanges();

    expect(component.view()).toBe('form');
    expect(el.querySelector('app-form-container')).toBeTruthy();
  });

  it('deve entrar em modo edição ao chamar openEditForm', () => {
    const item = component.items()[0];

    component.openEditForm(item);

    expect(component.view()).toBe('form');
    expect(component.isEditing).toBe(true);
    expect(component['form'].controls.name.value).toBe(item.name);
    expect(component['form'].controls.email.value).toBe(item.email);
  });

  it('deve validar campos obrigatórios no submit inválido', () => {
    component.openForm();
    component['form'].patchValue({
      name: '',
      email: '',
      password: '',
      cityId: '',
    });

    component.onSubmit();

    expect(component.nameError).toBe('Nome é obrigatório.');
    expect(component.emailError).toBe('Email é obrigatório.');
    expect(component.passwordError).toBe('Senha é obrigatória.');
    expect(component.cityError).toBe('Cidade é obrigatória.');
  });

  it('deve criar um administrador novo', () => {
    const spy = vi.spyOn(apiService, 'create').mockReturnValue(
      of({
        name: 'Novo Admin',
        email: 'novo@email.com',
        password: '123456',
        cityId: 'maringa',
      }),
    );

    component.openForm();
    component['form'].patchValue({
      name: 'Novo Admin',
      email: 'novo@email.com',
      password: '123456',
      cityId: 'maringa',
    });

    const totalAntes = component.items().length;

    component.onSubmit();

    expect(spy).toHaveBeenCalled();
    expect(component.items().length).toBe(totalAntes + 1);
    expect(component.view()).toBe('list');
  });

  it('deve atualizar um administrador existente', () => {
    const item = component.items()[0];
    const spy = vi.spyOn(apiService, 'update').mockReturnValue(
      of({
        ...item,
        name: 'Nome Atualizado',
      }),
    );

    component.openEditForm(item);
    component['form'].patchValue({
      name: 'Nome Atualizado',
      email: item.email,
      password: item.password,
      cityId: item.cityId,
    });

    component.onSubmit();

    expect(spy).toHaveBeenCalled();
    expect(component.items()[0].name).toBe('Nome Atualizado');
    expect(component.view()).toBe('list');
  });

  it('deve excluir um administrador', () => {
    const item = component.items()[0];
    const spy = vi.spyOn(apiService, 'delete').mockReturnValue(of(void 0));
    const totalAntes = component.items().length;

    component.confirmDelete(item);
    component.executeDelete();

    expect(spy).toHaveBeenCalled();
    expect(component.items().length).toBe(totalAntes - 1);
    expect(component.deletingItem()).toBeNull();
  });
});