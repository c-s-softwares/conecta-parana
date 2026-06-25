import { Injectable } from '@angular/core';
import { BaseCrudApi } from '../../core/services/base-crud-api';
import { AdministratorItem } from './admins.model';

@Injectable({ providedIn: 'root' })
export class AdminsApi extends BaseCrudApi<AdministratorItem> {
  protected readonly endpoint = 'administrators';
}
