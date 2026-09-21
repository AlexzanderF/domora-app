"use server";

import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/db";
import { requests } from "@/db/schema";
import { getServerSession } from "@/features/auth/server/session";
import type { CategoryId, Plan, RequestStatus, ServiceRequest } from "../types";

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
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user) {
    return { success: true, mode: "demo" };
  }

  const address = input.address.trim();
  const description = input.description.trim();
  const service = input.service.trim();

  if (!address || description.length < 5 || !service) {
    return {
      success: false,
      error:
        "Моля, въведете коректен адрес, услуга и описание с поне 5 символа.",
    };
  }

  if (typeof input.price !== "number" || input.price <= 0) {
    return {
      success: false,
      error: "Невалидна цена за избраната услуга.",
    };
  }

  const db = getDb();
  if (!db) {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
  }

  const requestId = crypto.randomUUID();
  const now = new Date();

  await db.insert(requests).values({
    id: requestId,
    clientId: user.id,
    specialistId: null,
    title: service,
    description,
    category: String(input.category),
    address,
    priority: input.priority ?? "STANDARD",
    status: 0,
    price: Math.round(input.price),
    clientPhone: user.phone || "0888000000",
  });

  revalidatePath("/requests");

  const createdRequest: ServiceRequest = {
    id: requestId,
    category: input.category,
    service,
    address,
    date: input.date || now.toISOString().split("T")[0],
    time:
      input.time ||
      now.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" }),
    price: Math.round(input.price),
    status: 0 as RequestStatus,
    description,
    plan: input.plan,
  };

  return {
    success: true,
    mode: "db",
    request: createdRequest,
  };
}
