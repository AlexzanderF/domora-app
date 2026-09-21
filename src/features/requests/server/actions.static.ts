import type { CategoryId, Plan, ServiceRequest } from "../types";

export interface CreateServiceRequestInput {
  category: CategoryId;
  service: string;
  address: string;
  description: string;
  date?: string;
  time?: string;
  price: number;
  plan?: Plan;
  priority?: "STANDARD" | "URGENT" | "EMERGENCY";
}

export interface CreateServiceRequestResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
  request?: ServiceRequest;
}

export async function createServiceRequestAction(
  input: CreateServiceRequestInput,
): Promise<CreateServiceRequestResult> {
  void input;
  return { success: true, mode: "demo" };
}
