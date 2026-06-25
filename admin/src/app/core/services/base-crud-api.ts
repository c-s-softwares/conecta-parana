import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FilterValues, ListParams, PaginatedResponseDto } from './api.types';

export abstract class BaseCrudApi<T, F extends FilterValues = FilterValues> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly endpoint: string;

  protected get baseUrl(): string {
    return `${environment.apiUrl}/${this.endpoint}`;
  }

  list(params?: ListParams<F>): Observable<PaginatedResponseDto<T>> {
    return this.http.get<PaginatedResponseDto<T>>(this.baseUrl, {
      params: this.buildParams(params),
    });
  }

  get(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  create<B = Partial<T>>(body: B): Observable<T> {
    return this.http.post<T>(this.baseUrl, body);
  }

  update<B = Partial<T>>(id: string, body: B): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private buildParams(input?: ListParams<F>): HttpParams {
    let params = new HttpParams();
    if (!input) return params;
    const flat: Record<string, unknown> = {
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
      ...input.filters,
    };
    for (const [k, v] of Object.entries(flat)) {
      if (v === undefined || v === null || v === '') continue;
      params = params.set(k, String(v));
    }
    return params;
  }
}
