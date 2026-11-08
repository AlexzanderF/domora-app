import { getDb, tariffs } from "@/db";
import { defaultTariffs, tariffsFromRows } from "./index";
import type { Tariffs } from "@/features/requests/types";

// Server-only (reads the database); kept apart from ./index so client
// components can import the pure quote functions without bundling `pg`.
export async function findTariffs(): Promise<Tariffs> {
  const db = getDb();
  if (!db) return defaultTariffs;
  return tariffsFromRows(await db.select().from(tariffs));
}
