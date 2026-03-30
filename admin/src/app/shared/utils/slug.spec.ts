import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('deve converter texto simples em slug', () => {
    expect(generateSlug('Notícia Teste')).toBe('/noticia-teste');
  });

  it('deve começar com /', () => {
    expect(generateSlug('teste')).toMatch(/^\//);
  });

  it('deve converter para minúsculas', () => {
    expect(generateSlug('TESTE MAIÚSCULO')).toBe('/teste-maiusculo');
  });

  it('deve remover acentos', () => {
    expect(generateSlug('àáâãäéèêëíìîïóòôõöúùûüç')).toBe(
      '/aaaaaeeeeiiiiooooouuuuc',
    );
  });

  it('deve substituir espaços por hífens', () => {
    expect(generateSlug('um   dois   tres')).toBe('/um-dois-tres');
  });

  it('deve remover caracteres especiais', () => {
    expect(generateSlug('titulo!@#$%&*legal')).toBe('/titulolegal');
  });

  it('deve fazer trim do texto', () => {
    expect(generateSlug('  espaço  ')).toBe('/espaco');
  });

  it('deve tratar múltiplos espaços como um único hífen', () => {
    expect(generateSlug('a  b   c')).toBe('/a-b-c');
  });

  it('deve preservar números', () => {
    expect(generateSlug('noticia 123')).toBe('/noticia-123');
  });

  it('deve preservar hífens existentes', () => {
    expect(generateSlug('já-tem-hifen')).toBe('/ja-tem-hifen');
  });

  it('deve retornar apenas / para string vazia', () => {
    expect(generateSlug('')).toBe('/');
  });

  it('deve tratar o exemplo completo do usuário', () => {
    expect(
      generateSlug('TÍtulo notiçia legal Fõda/;[.,*&%$#@!,^`{+\'"'),
    ).toBe('/titulo-noticia-legal-foda');
  });
});
