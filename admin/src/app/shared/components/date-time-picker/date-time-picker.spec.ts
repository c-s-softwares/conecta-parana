import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTimePicker } from './date-time-picker';

describe('DateTimePicker', () => {
  let fixture: ComponentFixture<DateTimePicker>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DateTimePicker] });
    fixture = TestBed.createComponent(DateTimePicker);
    el = fixture.nativeElement as HTMLElement;
  });

  function openCalendar(): void {
    (el.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function clickDay(day: string): void {
    const button = Array.from(el.querySelectorAll('button')).find(
      (b) =>
        b.textContent?.trim() === day &&
        (b as HTMLElement).style.opacity === '',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  function clickButtonWithText(text: string): void {
    const button = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === text,
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  it('exibe a data no formato BR (dd/mm/aaaa HH:MM)', () => {
    fixture.componentInstance.writeValue('2030-06-20T19:00');
    fixture.detectChanges();

    expect(el.querySelector('button')?.textContent?.trim()).toContain(
      '20/06/2030 19:00',
    );
  });

  it('emite o valor no formato datetime-local ao escolher dia e hora', () => {
    let emitted = '';
    fixture.componentInstance.registerOnChange((value) => (emitted = value));
    fixture.componentInstance.writeValue('2030-06-01T00:00');
    fixture.detectChanges();

    openCalendar();
    clickDay('20');

    const timeInput = el.querySelector('input') as HTMLInputElement;
    timeInput.value = '19:00';
    timeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emitted).toBe('2030-06-20T19:00');
  });

  it('seleciona a hora pelo relógio com AM/PM em 24h', () => {
    let emitted = '';
    fixture.componentInstance.registerOnChange((value) => (emitted = value));
    fixture.componentInstance.writeValue('2030-06-20T00:00');
    fixture.detectChanges();

    openCalendar();
    // alterna para PM e escolhe a hora 7 no relógio -> 19h
    clickButtonWithText('AM');
    const seven = Array.from(el.querySelectorAll('svg g')).find(
      (g) => g.querySelector('text')?.textContent?.trim() === '7',
    ) as SVGGElement;
    seven.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted).toBe('2030-06-20T19:00');
  });

  it('não abre o calendário quando desabilitado', () => {
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();

    openCalendar();

    expect(el.querySelector('svg')).toBeNull();
  });
});
