import { Role } from "../constants/roles";

export interface CommonFields {
  email: string;
  password: string;
  contact_number: string;
}

export interface DonorFields extends CommonFields {
  role: Role.Donor;
  full_name: string;
  address: string;
}

export interface NgoFields extends CommonFields {
  role: Role.Ngo;
  organization_name: string;
  address: string;
}

export interface StaffFields extends CommonFields {
  role: Role.Staff;
  full_name: string;
}

export interface DriverFields extends CommonFields {
  role: Role.Driver;
  vehicle_info: string;
  full_name: string;
}

// 4) Union of all possible payloads
export type RegisterFormValues =
  | DonorFields
  | NgoFields
  | StaffFields
  | DriverFields;
