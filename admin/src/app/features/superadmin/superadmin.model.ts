export interface SuperadminForm {
  name: string;
  email: string;
  password: string;
  cityId: string;
}
export interface AdministratorItem extends SuperadminForm {
  id: number;
}