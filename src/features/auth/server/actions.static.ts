import type { AuthActionResult } from "./actions";
import type { ClientRegistrationInput } from "../types";

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

export async function logoutAction(): Promise<{ success: boolean }> {
  return { success: true };
}
