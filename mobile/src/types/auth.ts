export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  email: string;
  role: UserRole;
  location: string;
  district: string;
  profile_image: string | null;
  date_joined: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'ADMIN'>;
  location?: string;
  district?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}