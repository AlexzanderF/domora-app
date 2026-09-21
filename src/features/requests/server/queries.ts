import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests } from "@/db/schema";
import type { CategoryId, RequestStatus, ServiceRequest } from "../types";

export async function findClientRequests(
  clientId: string,
): Promise<ServiceRequest[] | null> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(requests)
    .where(eq(requests.clientId, clientId))
    .orderBy(desc(requests.createdAt));

  return rows.map((row) => {
    const rawCategory = Number(row.category);
    const category: CategoryId =
      rawCategory >= 0 && rawCategory <= 5 ? (rawCategory as CategoryId) : 0;
    const rawStatus = row.status;
    const status: RequestStatus =
      rawStatus >= 0 && rawStatus <= 5 ? (rawStatus as RequestStatus) : 0;

    return {
      id: row.id,
      category,
      service: row.title,
      address: row.address,
      date: row.createdAt.toISOString().split("T")[0],
      time: row.createdAt.toLocaleTimeString("bg-BG", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: row.price,
      status,
      description: row.description,
    };
  });
}
