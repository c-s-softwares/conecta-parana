export interface NewsForm {
  title: string;
  description: string;
  type: 'saude' | 'educacao' | 'infra' | 'geral' | 'outros';
  linkType: 'interno' | 'externo';
  externalUrl?: string; // so visu
  isActive: boolean;
}

export interface NewsItem extends Omit<NewsForm, 'externalUrl'> {
  id: string;
  cityId?: string;
  createdAt?: string;
  updatedAt?: string;
}
