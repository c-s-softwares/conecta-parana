export interface PostForm {
  title: string;
  description: string;
  category: 'evento' | 'noticia' | 'comunicado';
}