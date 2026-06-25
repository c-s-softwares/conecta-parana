export interface EventItem {
  id: string;
  title: string;
  type: string;
  description: string;
  event_date: string;
  latitude: number | null;
  longitude: number | null;
}

export interface EventsFormValues {
  title: string;
  type: string;
  description: string;
  event_date: string;
  latitude: number | null;
  longitude: number | null;
}
