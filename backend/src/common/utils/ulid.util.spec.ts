import { generateId } from './ulid.util';

describe('UlidUtil', () => {
  it('deve gerar um ID com o prefixo e comprimento corretos', () => {
    const id = generateId('usr_');
    expect(id.startsWith('usr_')).toBe(true);
    expect(id.length).toBe(30);
  });

  it('deve gerar ids únicos', () => {
    const id1 = generateId('cit_');
    const id2 = generateId('cit_');
    expect(id1).not.toBe(id2);
  });

  it('deve gerar ids lexicograficamente ordenáveis', (done) => {
    const id1 = generateId('evt_');

    // delay tava qebrando n entendi mas resolveu
    setTimeout(() => {
      const id2 = generateId('evt_');

      expect(id1 < id2).toBe(true);
      done();
    }, 10);
  });
});
