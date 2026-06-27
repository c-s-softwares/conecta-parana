import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Resposta de `POST /uploads/photos`. */
export interface PhotoUploadResult {
  id: string;
  url: string;
  thumbUrl: string | null;
  entityType: string;
  entityId: string;
}

export type UploadEntityType =
  | 'event'
  | 'local'
  | 'ticket'
  | 'news'
  | 'communicate';

/**
 * Upload de fotos associadas a uma entidade. Generico por `entityType` para
 * reuso (eventos, locais, etc.). Envia multipart/form-data.
 */
@Injectable({ providedIn: 'root' })
export class UploadsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/uploads/photos`;

  upload(
    file: File,
    entityType: UploadEntityType,
    entityId: string,
  ): Observable<PhotoUploadResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', entityType);
    form.append('entityId', entityId);
    return this.http.post<PhotoUploadResult>(this.baseUrl, form);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
