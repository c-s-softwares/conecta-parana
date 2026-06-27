import { Component, inject, input, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './form-field.html',
})
export class FormField {
  private readonly toast = inject(ToastService);

  label = input.required<string>();
  fieldId = input.required<string>();
  required = input<boolean>(false);
  errorMessage = input<string>('');
  showError = input<boolean>(false);


  type = input<string>('');
  accept = input<string>('');
  maxSizeMb = input<number>(0);
  multiple = input<boolean>(false);
  hint = input<string>('');

  fileChange = output<File[]>();

  protected selectedFiles = signal<File[]>([]);

  protected onFilesSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (!inputEl.files || inputEl.files.length === 0) return;
    this.handleFiles(Array.from(inputEl.files));
    inputEl.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer || event.dataTransfer.files.length === 0) return;
    this.handleFiles(Array.from(event.dataTransfer.files));
  }

  private handleFiles(files: File[]): void {
    const validFiles: File[] = [];
    let hasSizeError = false;
    let hasTypeError = false;

    for (const file of files) {
      if (!this.isAcceptedType(file)) {
        hasTypeError = true;
        continue;
      }

      if (this.maxSizeMb() > 0 && file.size > this.maxSizeMb() * 1024 * 1024) {
        hasSizeError = true;
        continue;
      }

      validFiles.push(file);
    }

    if (hasTypeError) {
      this.toast.show('error', 'Tipo de arquivo não suportado.');
    }
    if (hasSizeError) {
      this.toast.show('error', `Arquivo muito grande (máx ${this.maxSizeMb()} MB).`);
    }

    if (validFiles.length > 0) {
      if (this.multiple()) {
        this.selectedFiles.update(current => [...current, ...validFiles]);
      } else {
        this.selectedFiles.set([validFiles[0]]);
      }
      this.fileChange.emit(this.selectedFiles());
    }
  }

  protected removeFile(index: number): void {
    this.selectedFiles.update(current => current.filter((_, i) => i !== index));
    this.fileChange.emit(this.selectedFiles());
  }

  private isAcceptedType(file: File): boolean {
    const filter = this.accept();
    if (!filter) return true;
    const acceptedPatterns = filter.split(',').map(s => s.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    return acceptedPatterns.some(pattern => {
      if (pattern.startsWith('.')) {
        return fileName.endsWith(pattern);
      }
      if (pattern.endsWith('/*')) {
        const category = pattern.slice(0, -2);
        return fileType.startsWith(category + '/');
      }
      return fileType === pattern;
    });
  }
}

