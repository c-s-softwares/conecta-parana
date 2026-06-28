import { FilterValues } from '../../core/services/api.types';

export interface EventPhoto {
  id: string;
  thumbUrl: string | null;
  url?: string;
}

export interface EventItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  type: string;
  isActive: boolean;
  eventDate: string;
  cityId: string;
  userId: string;
  localId: string | null;
  createdAt: string;
  updatedAt: string;
  photos: EventPhoto[];
}

export interface EventDetail extends EventItem {
  likesCount: number;
  liked: boolean;
  saved: boolean;
}

export interface EventsFormValues {
  title: string;
  description: string;
  type: string;
  isActive: boolean;
  eventDate: string;
}

export type EventOrder = 'date_asc' | 'date_desc';

export interface EventsFilters extends FilterValues {
  isActive?: boolean;
  order?: EventOrder;
}

export const EVENT_TYPES = [
  'festa',
  'oficial',
  'esportivo',
  'cultural',
  'outros',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
