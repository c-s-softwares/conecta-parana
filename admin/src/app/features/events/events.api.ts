import { Injectable } from '@angular/core';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { EventItem } from './events.model';

@Injectable({ providedIn: 'root' })
export class EventsApi extends BaseCrudApi<EventItem> {
  protected readonly endpoint = 'events';
}
