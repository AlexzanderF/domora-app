export interface UpdateSpecialistStatusResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
}

export async function updateSpecialistStatusAction(
  userId: string,
  status: "ACTIVE" | "REJECTED",
): Promise<UpdateSpecialistStatusResult> {
  void userId;
  void status;
  return { success: true, mode: "demo" };
}
