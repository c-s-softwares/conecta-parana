import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { EventDetail, EventItem, EventsFilters } from './events.model';

@Injectable({ providedIn: 'root' })
export class EventsApi extends BaseCrudApi<EventItem, EventsFilters> {
  protected readonly endpoint = 'events';

  override get(id: string): Observable<EventDetail> {
    return this.http.get<EventDetail>(`${this.baseUrl}/${id}`);
  }

  /** Backend usa PUT no update (exceção ao PATCH do BaseCrudApi). */
  override update<B = Partial<EventItem>>(
    id: string,
    body: B,
  ): Observable<EventItem> {
    return this.http.put<EventItem>(`${this.baseUrl}/${id}`, body);
  }
}
