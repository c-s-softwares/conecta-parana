import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './news.page.html',
})
export class NewsPage {
  private readonly fb = inject(FormBuilder);

  protected readonly view = signal<'list' | 'form'>('list');
  protected readonly linkType = signal<'external' | 'internal'>('external');

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    linkType: ['external' as 'internal' | 'external'],
    linkUrl: [''],
    isActive: [true],
  });

  openForm(): void {
    this.form.reset({
      title: '',
      description: '',
      linkType: 'external',
      linkUrl: '',
      isActive: true,
    });
    this.linkType.set('external');
    this.view.set('form');
  }

  closeForm(): void {
    this.view.set('list');
  }

  onLinkTypeChange(): void {
    const type = this.form.controls.linkType.value;
    this.linkType.set(type);
    this.form.controls.linkUrl.reset();
  }

  onSubmit(): void {
    if (this.linkType() === 'external') {
      this.form.controls.linkUrl.setValidators(Validators.required);
      this.form.controls.linkUrl.updateValueAndValidity();
    } else {
      this.form.controls.linkUrl.clearValidators();
      this.form.controls.linkUrl.updateValueAndValidity();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.linkType === 'internal') {
      raw.linkUrl = this.generateSlug(raw.title);
    }

    console.log('Notícia criada:', raw);
    this.view.set('list');
  }

  protected generateSlug(title: string): string {
    return (
      '/' +
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
    );
  }
}
