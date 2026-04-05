export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}
