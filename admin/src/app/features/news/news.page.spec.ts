import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsPage } from './news.page';

describe('NewsPage', () => {
  let fixture: ComponentFixture<NewsPage>;
  let component: NewsPage;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('deve criar o componente com h1 "Notícias"', () => {
    expect(component).toBeTruthy();
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Notícias');
  });
});
