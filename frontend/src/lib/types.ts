export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrativo',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};

export function formatUserRole(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';
  options: string[];
  order: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  targetRoles: UserRole[];
  isActive: boolean;
  createdAt: string;
  author?: { id: string; name: string };
  questions?: SurveyQuestion[];
  _count?: { responses: number };
}

export interface SurveyResponseAnswer {
  id: string;
  value: string;
  question: {
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';
    order: number;
  };
}

export interface SurveyResponse {
  id: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  answers: SurveyResponseAnswer[];
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}
