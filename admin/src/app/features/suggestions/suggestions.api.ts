import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespondSuggestionDto, SuggestionResponseDto } from './suggestions.model';

@Injectable({ providedIn: 'root' })
export class SugestoesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listCitySuggestions(): Observable<SuggestionResponseDto[]> {
    return this.http.get<SuggestionResponseDto[]>(`${this.baseUrl}/suggestions`);
  }

  getSuggestionDetail(id: string): Observable<SuggestionResponseDto> {
    return this.http.get<SuggestionResponseDto>(`${this.baseUrl}/suggestions/${id}`);
  }

  respond(id: string, response: string): Observable<SuggestionResponseDto> {
    const body: RespondSuggestionDto = { response };
    return this.http.put<SuggestionResponseDto>(`${this.baseUrl}/suggestions/${id}/respond`, body);
  }

  conclude(id: string, response: string): Observable<SuggestionResponseDto> {
    const body: RespondSuggestionDto = { response };
    return this.http.put<SuggestionResponseDto>(`${this.baseUrl}/suggestions/${id}/conclude`, body);
  }

  archive(id: string, response?: string): Observable<SuggestionResponseDto> {
    const body: RespondSuggestionDto = { response };
    return this.http.put<SuggestionResponseDto>(`${this.baseUrl}/suggestions/${id}/archive`, body);
  }
}
