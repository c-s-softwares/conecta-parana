import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const CLOCK_CENTER = 100;
const CLOCK_NUMBER_RADIUS = 70;

interface DayCell {
  date: string;
  day: number;
  inMonth: boolean;
}

interface ClockMark {
  value: number;
  label: string;
  x: number;
  y: number;
  selected: boolean;
}

type ClockMode = 'hours' | 'minutes';

/**
 * Seletor de data e hora em formato BR (dd/mm/aaaa) com calendário e relógio
 * analógico próprios - o input nativo segue o locale do navegador e não permite
 * forçar o formato 24h. O valor (model/form) usa o formato `yyyy-MM-ddTHH:mm`.
 */
@Component({
  selector: 'app-date-time-picker',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './date-time-picker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePicker),
      multi: true,
    },
  ],
})
export class DateTimePicker implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly inputId = input<string>('');
  readonly placeholder = input<string>('Selecione data e hora');

  protected readonly weekdays = WEEKDAYS;
  protected readonly open = signal(false);
  protected readonly disabled = signal(false);

  protected readonly selectedDate = signal<string>(''); // yyyy-MM-dd
  protected readonly time = signal<string>(''); // HH:MM (24h)
  protected readonly viewYear = signal<number>(new Date().getFullYear());
  protected readonly viewMonth = signal<number>(new Date().getMonth());
  protected readonly clockMode = signal<ClockMode>('hours');

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly monthLabel = computed(
    () => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`,
  );

  protected readonly weeks = computed<DayCell[][]>(() =>
    buildCalendar(this.viewYear(), this.viewMonth()),
  );

  protected readonly display = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${this.time() || '--:--'}`;
  });

  protected readonly hour24 = computed(() => this.parts().h);
  protected readonly minute = computed(() => this.parts().m);
  protected readonly period = computed(() => (this.parts().h >= 12 ? 'PM' : 'AM'));
  protected readonly timeDisplay = computed(
    () => `${pad(this.parts().h)}:${pad(this.parts().m)}`,
  );

  protected readonly clockMarks = computed<ClockMark[]>(() => {
    const isHours = this.clockMode() === 'hours';
    const selected = isHours ? hourTo12(this.parts().h) : this.parts().m;
    return Array.from({ length: 12 }, (_, index) => {
      const value = isHours ? (index === 0 ? 12 : index) : index * 5;
      const angle = (index * 30 * Math.PI) / 180;
      return {
        value,
        label: isHours ? String(value) : pad(value),
        x: CLOCK_CENTER + CLOCK_NUMBER_RADIUS * Math.sin(angle),
        y: CLOCK_CENTER - CLOCK_NUMBER_RADIUS * Math.cos(angle),
        selected: value === selected,
      };
    });
  });

  protected readonly hand = computed(() => {
    const isHours = this.clockMode() === 'hours';
    const steps = isHours ? hourTo12(this.parts().h) % 12 : this.parts().m / 5;
    const angle = (steps * 30 * Math.PI) / 180;
    return {
      x: CLOCK_CENTER + CLOCK_NUMBER_RADIUS * Math.sin(angle),
      y: CLOCK_CENTER - CLOCK_NUMBER_RADIUS * Math.cos(angle),
    };
  });

  writeValue(value: string | null): void {
    if (value) {
      const [datePart, timePart] = value.split('T');
      this.selectedDate.set(datePart ?? '');
      this.time.set((timePart ?? '').slice(0, 5));
      this.syncViewTo(datePart);
    } else {
      this.selectedDate.set('');
      this.time.set('');
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    this.open.update((value) => !value);
    if (this.open()) {
      this.clockMode.set('hours');
      this.syncViewTo(this.selectedDate());
    }
  }

  protected prevMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected selectDay(cell: DayCell): void {
    this.selectedDate.set(cell.date);
    if (!this.time()) this.time.set('12:00');
    this.emit();
  }

  protected isSelected(cell: DayCell): boolean {
    return cell.date === this.selectedDate();
  }

  protected isToday(cell: DayCell): boolean {
    return cell.date === todayStr();
  }

  protected setClockMode(mode: ClockMode): void {
    this.clockMode.set(mode);
  }

  protected selectClock(value: number): void {
    if (this.clockMode() === 'hours') {
      const h24 = this.period() === 'PM' ? (value % 12) + 12 : value % 12;
      this.setTime(h24, this.parts().m);
      this.clockMode.set('minutes');
    } else {
      this.setTime(this.parts().h, value);
    }
  }

  protected togglePeriod(): void {
    const h = this.parts().h;
    this.setTime(h >= 12 ? h - 12 : h + 12, this.parts().m);
  }

  protected onTimeText(value: string): void {
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      this.time.set(value);
      this.emit();
    }
  }

  protected close(): void {
    this.open.set(false);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private parts(): { h: number; m: number } {
    const [h, m] = (this.time() || '00:00').split(':').map(Number);
    return { h: h || 0, m: m || 0 };
  }

  private setTime(h: number, m: number): void {
    this.time.set(`${pad(h)}:${pad(m)}`);
    this.emit();
  }

  private shiftMonth(delta: number): void {
    let month = this.viewMonth() + delta;
    let year = this.viewYear();
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    this.viewMonth.set(month);
    this.viewYear.set(year);
  }

  private syncViewTo(date: string | undefined): void {
    if (!date) return;
    const [year, month] = date.split('-').map(Number);
    this.viewYear.set(year);
    this.viewMonth.set(month - 1);
  }

  private emit(): void {
    const date = this.selectedDate();
    if (!date) {
      this.onChange('');
      return;
    }
    this.onChange(`${date}T${this.time() || '00:00'}`);
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function hourTo12(h: number): number {
  const value = h % 12;
  return value === 0 ? 12 : value;
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function buildCalendar(year: number, month: number): DayCell[][] {
  const first = new Date(year, month, 1);
  const cursor = new Date(year, month, 1 - first.getDay());
  const weeks: DayCell[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const days: DayCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      days.push({
        date: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`,
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}
