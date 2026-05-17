export interface CommunicateForm {
  title: string;
  description: string;
  category: 'evento' | 'noticia' | 'comunicado';
}

export interface Communicate extends CommunicateForm {
  id: number;
}