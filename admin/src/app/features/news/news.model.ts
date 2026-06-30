export interface NewsPhoto {
  id: string;
  thumbUrl: string | null;
  url?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  type: 'saude' | 'educacao' | 'infra' | 'geral' | 'outros';
  linkType: 'interno' | 'externo';
  linkUrl?: string | null;
  isActive: boolean;
  cityId?: string;
  cityName?: string;
  createdAt?: string;
  updatedAt?: string;
  photos: NewsPhoto[];
}

export interface NewsDetail extends NewsItem {
  likesCount: number;
  liked: boolean;
  saved: boolean;
}
