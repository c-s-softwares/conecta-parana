import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { NewsDetail, NewsItem } from './news.model';

@Injectable({ providedIn: 'root' })
export class NewsApi extends BaseCrudApi<NewsItem> {
  protected readonly endpoint = 'news';

  override get(id: string): Observable<NewsDetail> {
    return this.http.get<NewsDetail>(`${this.baseUrl}/${id}`);
  }
}
