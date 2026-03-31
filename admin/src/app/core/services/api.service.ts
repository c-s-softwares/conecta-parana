import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // TODO: injetar HttpClient e usar environment.apiUrl quando backend estiver pronto
  create<T>(endpoint: string, data: T): Observable<T> {
    console.log(`[API] POST ${endpoint}:`, data);
    // TODO: substituir por this.http.post<T>(`${environment.apiUrl}/${endpoint}`, data)
    return of(data);
  }
}
