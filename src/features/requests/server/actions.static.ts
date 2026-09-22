import { RequestPriority } from "../types";
import type { CategoryId, Plan, RequestAction, ServiceRequest } from "../types";

export interface CreateServiceRequestInput {
  category: CategoryId;
  service: string;
  address: string;
  description: string;
  date?: string;
  time?: string;
  price: number;
  plan?: Plan;
  priority?: RequestPriority;
}

export interface ServiceRequestActionResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
  request?: ServiceRequest;
}

export async function createServiceRequestAction(
  input: CreateServiceRequestInput,
): Promise<ServiceRequestActionResult> {
  void input;
  return { success: true, mode: "demo" };
}

export async function assignSpecialistAction(
  requestId: string,
): Promise<ServiceRequestActionResult> {
  void requestId;
  return { success: true, mode: "demo" };
}

export async function startWorkAction(
  requestId: string,
): Promise<ServiceRequestActionResult> {
  void requestId;
  return { success: true, mode: "demo" };
}

export async function completeWorkAction(
  requestId: string,
  report?: string,
): Promise<ServiceRequestActionResult> {
  void requestId;
  void report;
  return { success: true, mode: "demo" };
}

export async function cancelRequestAction(
  requestId: string,
): Promise<ServiceRequestActionResult> {
  void requestId;
  return { success: true, mode: "demo" };
}

export async function transitionRequestServerAction(
  requestId: string,
  action: RequestAction,
): Promise<ServiceRequestActionResult> {
  void requestId;
  void action;
  return { success: true, mode: "demo" };
}
