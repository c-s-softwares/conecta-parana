export interface Environment {
  production: boolean;
  name: 'production' | 'staging' | 'development';
  apiUrl: string;
}
