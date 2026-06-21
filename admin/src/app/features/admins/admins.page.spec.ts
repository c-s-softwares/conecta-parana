import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminsPage } from './admins.page';

describe('AdminsPage', () => {
  let fixture: ComponentFixture<AdminsPage>;
  let component: AdminsPage;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminsPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('deve criar o componente com h1 "Administradores"', () => {
    expect(component).toBeTruthy();
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Administradores');
  });
});
