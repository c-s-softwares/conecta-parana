import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormField } from './form-field';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [FormField],
  template: `
    <app-form-field
      [label]="label"
      [fieldId]="fieldId"
      [required]="required"
      [showError]="showError"
      [errorMessage]="errorMessage"
      [type]="type"
      [accept]="accept"
      [maxSizeMb]="maxSizeMb"
      [multiple]="multiple"
      (fileChange)="onFileChange($event)"
    >
      <input [id]="fieldId" />
    </app-form-field>
  `,
})
class TestHost {
  label = 'Título';
  fieldId = 'title';
  required = false;
  showError = false;
  errorMessage = '';
  type = '';
  accept = '';
  maxSizeMb = 0;
  multiple = false;

  lastFiles?: File[];
  onFileChange(files: File[]) {
    this.lastFiles = files;
  }
}

describe('FormField', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;
  let mockToastService: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockToastService = {
      show: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('deve renderizar o label com texto correto', () => {
    fixture.detectChanges();
    const label = el.querySelector('label');
    expect(label?.textContent).toContain('Título');
  });

  it('deve associar o label ao fieldId via for', () => {
    fixture.detectChanges();
    const label = el.querySelector('label');
    expect(label?.getAttribute('for')).toBe('title');
  });

  it('não deve mostrar asterisco quando required é false', () => {
    fixture.detectChanges();
    const span = el.querySelector('label span');
    expect(span).toBeNull();
  });

  it('deve mostrar asterisco vermelho quando required é true', () => {
    host.required = true;
    fixture.detectChanges();
    const span = el.querySelector('label span');
    expect(span?.textContent).toContain('*');
    expect(span?.classList.contains('text-red-600')).toBe(true);
  });

  it('não deve mostrar mensagem de erro quando showError é false', () => {
    host.errorMessage = 'Erro qualquer';
    host.showError = false;
    fixture.detectChanges();
    const p = el.querySelector('p');
    expect(p).toBeNull();
  });

  it('deve mostrar mensagem de erro quando showError é true', () => {
    host.errorMessage = 'Campo obrigatório.';
    host.showError = true;
    fixture.detectChanges();
    const p = el.querySelector('p');
    expect(p?.textContent).toContain('Campo obrigatório.');
  });

  it('deve projetar o conteúdo (ng-content) se type nao for file', () => {
    fixture.detectChanges();
    const input = el.querySelector('input#title');
    expect(input).toBeTruthy();
  });

  it('deve renderizar dropzone/button de upload quando type e file e ocultar ng-content', () => {
    host.type = 'file';
    fixture.detectChanges();

    const uploadBtn = el.querySelector('button');
    const projectedInput = el.querySelector('input#title') as HTMLInputElement;

    expect(uploadBtn).toBeTruthy();
    expect(projectedInput?.classList.contains('hidden')).toBe(true);
    expect(uploadBtn?.textContent).toContain('Arraste ou clique para adicionar arquivos');
  });

  it('deve emitir fileChange ao selecionar arquivo valido', () => {
    host.type = 'file';
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const file = new File(['conteudo'], 'teste.png', { type: 'image/png' });
    const mockEvent = {
      target: {
        files: [file],
        value: ''
      }
    } as unknown as Event;

    formField['onFilesSelected'](mockEvent);
    fixture.detectChanges();

    expect(host.lastFiles?.length).toBe(1);
    expect(host.lastFiles?.[0].name).toBe('teste.png');
    expect(mockToastService.show).not.toHaveBeenCalled();
  });

  it('deve rejeitar arquivo se exceder maxSizeMb e disparar Toast', () => {
    host.type = 'file';
    host.maxSizeMb = 1;
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'grande.zip', { type: 'application/zip' });
    const mockEvent = {
      target: {
        files: [bigFile],
        value: ''
      }
    } as unknown as Event;

    formField['onFilesSelected'](mockEvent);
    fixture.detectChanges();

    expect(host.lastFiles).toBeUndefined();
    expect(mockToastService.show).toHaveBeenCalledWith('error', 'Arquivo muito grande (máx 1 MB).');
  });

  it('deve rejeitar arquivo se tipo nao corresponder ao accept e disparar Toast', () => {
    host.type = 'file';
    host.accept = 'image/*,.pdf';
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const invalidFile = new File(['conteudo'], 'documento.txt', { type: 'text/plain' });
    const mockEvent = {
      target: {
        files: [invalidFile],
        value: ''
      }
    } as unknown as Event;

    formField['onFilesSelected'](mockEvent);
    fixture.detectChanges();

    expect(host.lastFiles).toBeUndefined();
    expect(mockToastService.show).toHaveBeenCalledWith('error', 'Tipo de arquivo não suportado.');
  });

  it('deve aceitar arquivo com extensao no accept', () => {
    host.type = 'file';
    host.accept = '.pdf';
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const pdfFile = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [pdfFile],
        value: ''
      }
    } as unknown as Event;

    formField['onFilesSelected'](mockEvent);
    fixture.detectChanges();

    expect(host.lastFiles?.length).toBe(1);
    expect(host.lastFiles?.[0].name).toBe('documento.pdf');
  });

  it('deve permitir múltiplos arquivos quando multiple e true', () => {
    host.type = 'file';
    host.multiple = true;
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const file1 = new File(['1'], 'img1.png', { type: 'image/png' });
    const file2 = new File(['2'], 'img2.png', { type: 'image/png' });
    const mockEvent = {
      target: {
        files: [file1, file2],
        value: ''
      }
    } as unknown as Event;

    formField['onFilesSelected'](mockEvent);
    fixture.detectChanges();

    expect(host.lastFiles?.length).toBe(2);
  });

  it('deve remover arquivo selecionado ao clicar no botao remover', async () => {
    host.type = 'file';
    host.multiple = true;
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const file1 = new File(['1'], 'img1.png', { type: 'image/png' });
    const mockEvent = {
      target: {
        files: [file1],
        value: ''
      }
    } as unknown as Event;

    formField['onFilesSelected'](mockEvent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.lastFiles?.length).toBe(1);

    const removeBtn = el.querySelector('button[aria-label="Remover arquivo"]') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();

    removeBtn.click();
    fixture.detectChanges();

    expect(host.lastFiles?.length).toBe(0);
  });

  it('deve aceitar arquivos via drag and drop', () => {
    host.type = 'file';
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.directive(FormField)).componentInstance as FormField;
    const file = new File(['drag'], 'dragged.png', { type: 'image/png' });
    const mockDragEvent = {
      preventDefault: () => void 0,
      dataTransfer: {
        files: [file]
      }
    } as unknown as DragEvent;

    formField['onDrop'](mockDragEvent);
    fixture.detectChanges();

    expect(host.lastFiles?.length).toBe(1);
    expect(host.lastFiles?.[0].name).toBe('dragged.png');
  });
});
