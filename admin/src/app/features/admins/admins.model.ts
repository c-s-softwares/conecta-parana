export interface AdminForm {
  name: string;
  email: string;
  password: string;
  cityId: string;
}

export interface AdministratorItem extends AdminForm {
  id: number;
}