import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventsPage } from './events.page';

describe('EventsPage', () => {
  let fixture: ComponentFixture<EventsPage>;
  let component: EventsPage;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('deve criar o componente com h1 "Eventos"', () => {
    expect(component).toBeTruthy();
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Eventos');
  });
});
