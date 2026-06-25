import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { City, CityStats } from './cities.model';

@Injectable({ providedIn: 'root' })
export class CitiesApi extends BaseCrudApi<City> {
  protected readonly endpoint = 'cities';

  getStats(): Observable<CityStats> {
    return this.http.get<CityStats>(`${this.baseUrl}/stats`);
  }
}
