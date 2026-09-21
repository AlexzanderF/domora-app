import type { AuthActionResult } from "./actions";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
  User,
} from "../types";

export async function loginAction(
  identifier: string,
  password: string,
): Promise<AuthActionResult> {
  void identifier;
  void password;
  return { mode: "demo" };
}

export async function registerClientAction(
  input: ClientRegistrationInput,
): Promise<AuthActionResult> {
  void input;
  return { mode: "demo" };
}

export async function registerSpecialistAction(
  input: SpecialistRegistrationInput,
): Promise<AuthActionResult> {
  void input;
  return { mode: "demo" };
}

export async function refreshUserAction(): Promise<{
  success: boolean;
  user: User | null;
  mode: "demo";
}> {
  return { success: true, user: null, mode: "demo" };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  return { success: true };
}
