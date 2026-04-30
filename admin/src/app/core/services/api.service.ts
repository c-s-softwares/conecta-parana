import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  create<T>(endpoint: string, data: T): Observable<T> {
    console.log(`[API] POST ${endpoint}:`, data);
    return of(data);
  }

  getAll<T>(endpoint: string): Observable<T[]> {
    console.log(`[API] GET ${endpoint}`);
    return of([] as T[]);
  }

  update<T>(endpoint: string, id: number, data: T): Observable<T> {
    console.log(`[API] PUT ${endpoint}/${id}:`, data);
    return of(data);
  }

  delete(endpoint: string, id: number): Observable<void> {
    console.log(`[API] DELETE ${endpoint}/${id}`);
    return of(void 0);
  }
}