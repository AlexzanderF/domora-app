export type UserRole = "CLIENT" | "SPECIALIST" | "ADMIN";

export type UserStatus = "ACTIVE" | "PENDING" | "REJECTED";

export interface SpecialistProfile {
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
