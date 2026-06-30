export interface CommunicatePhoto {
  id: string;
  thumbUrl: string | null;
}

export interface ComunicadoItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  photos: CommunicatePhoto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCommunicateDto {
  title: string;
  description: string;
  isActive: boolean;
}

export type UpdateCommunicateDto = Partial<CreateCommunicateDto>;

export interface CommunicateFilters {
  [key: string]: string | number | boolean | null | undefined;
  isActive?: boolean;
  cityId?: string;
}