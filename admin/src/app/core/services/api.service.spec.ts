import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('create deve retornar os dados enviados e logar com endpoint correto', () => {
    const data = { title: 'Teste', description: 'Desc' };
    let result: unknown;
    service.create('news', data).subscribe((r) => (result = r));

    expect(result).toEqual(data);
    expect(console.log).toHaveBeenCalledWith('[API] POST news:', data);
  });

  it('create deve funcionar com diferentes endpoints', () => {
    service.create('events', { id: 1 }).subscribe();
    expect(console.log).toHaveBeenCalledWith('[API] POST events:', expect.anything());
  });
});
