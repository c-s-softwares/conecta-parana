export class EventResponse {
  id!: string;
  title!: string;
  description!: string;
  type!: string;
  status!: string;
  eventDate!: Date;

  cityId!: string;
  userId!: string;
  localId?: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}
