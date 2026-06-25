import { Injectable } from '@angular/core';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { NewsItem } from './news.model';

@Injectable({ providedIn: 'root' })
export class NewsApi extends BaseCrudApi<NewsItem> {
  protected readonly endpoint = 'news';
}
