export interface PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type FilterValue = string | number | boolean;
export type FilterValues = Record<string, FilterValue | undefined | null>;

export interface ListParams<F extends FilterValues = FilterValues> {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: F;
}
