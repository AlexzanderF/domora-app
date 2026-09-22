import type { UserStatus } from "@/features/auth/types";
import type { Tariffs } from "@/features/requests/types";

export interface UpdateSpecialistStatusResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
}

export interface UpdateTariffsResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
}

export async function updateSpecialistStatusAction(
  userId: string,
  status: UserStatus,
): Promise<UpdateSpecialistStatusResult> {
  void userId;
  void status;
  return { success: true, mode: "demo" };
}

export async function updateTariffsAction(
  input: Tariffs,
): Promise<UpdateTariffsResult> {
  void input;
  return { success: true, mode: "demo" };
}
