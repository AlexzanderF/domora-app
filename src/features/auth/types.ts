export const UserRole = {
  Client: "CLIENT",
  Specialist: "SPECIALIST",
  Admin: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  Active: "ACTIVE",
  Pending: "PENDING",
  Rejected: "REJECTED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface SpecialistProfile {
  id?: number;
  userId?: number;
  category: string;
  area: string;
  experienceYears: number;
  bio: string;
  companyName?: string;
  eik?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  specialistProfile?: SpecialistProfile;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRegistrationInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
}

export interface SpecialistRegistrationInput extends ClientRegistrationInput {
  category: string;
  area: string;
  experienceYears: number;
  bio: string;
  companyName?: string;
  eik?: string;
}

export interface AuthSession {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
}
