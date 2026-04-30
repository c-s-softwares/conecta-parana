export interface EventsForm {
  title: string;
  type: string;
  description: string;
  event_date: string;
  category_id: string;
  latitude: number | null;
  longitude: number | null;
  local_id: string;
}
