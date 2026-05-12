import { ulid } from 'ulid';

export type TablePrefix =
  | 'usr_' // User
  | 'cit_' // City
  | 'evt_' // Event
  | 'pst_' // Post
  | 'nws_' // News
  | 'loc_' // Local
  | 'cat_' // Category
  | 'hlt_' // HealthCheck
  | 'sgt_' // Suggestion
  | 'nfy_' // Notification
  | 'lke_' // Like
  | 'fav_' // Favorite
  | 'pho_' // Photo
  | 'rfk_'; // RefreshToken

/**
 * GER A UM ULID com prefixo
 * O TOtal e de 30 char (4 chars prefix + 26 chars ULID).
 * @param prefix
 * @returns
 **/
export function generateId(prefix: TablePrefix): string {
  return `${prefix}${ulid()}`;
}
