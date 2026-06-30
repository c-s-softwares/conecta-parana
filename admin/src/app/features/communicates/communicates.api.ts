import { Injectable } from '@angular/core';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { ComunicadoItem, CommunicateFilters } from './communicates.model';

@Injectable({ providedIn: 'root' })
export class ComunicadosApi extends BaseCrudApi<ComunicadoItem, CommunicateFilters> {
  protected readonly endpoint = 'communicates';
}