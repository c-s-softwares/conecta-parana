export interface PostForm {
  title: string;
  description: string;
  category: 'evento' | 'noticia' | 'comunicado';
}

export interface Post extends PostForm {
  id: number;
}