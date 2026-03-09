import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { environment } from '../environments/environment';
import { Environment } from '../environments/environment.type';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Conecta Paraná Admin');
  });

  it('should display the environment badge', () => {
    // Badge de produção
    environment.name = 'production';
    let fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance['environmentBadgeClass']()).toBe(
      'bg-green-100 text-green-800',
    );

    // Badge de staging
    environment.name = 'staging';
    fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance['environmentBadgeClass']()).toBe(
      'bg-yellow-100 text-yellow-800',
    );
  });

});
