export interface City {
  id: string;
  name: string;
  state: string;
  adminCount: number;
}

export interface CityStats {
  total: number;
  withActiveAdmin: number;
  awaitingAdmin: number;
}
