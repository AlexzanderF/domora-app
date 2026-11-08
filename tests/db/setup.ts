import { sql } from "drizzle-orm";
import { afterAll, beforeEach } from "vitest";
import { closeDbPool, requireDb } from "@/db";
import { TEST_DATABASE_URL, assertTestDatabase } from "./config";

assertTestDatabase(TEST_DATABASE_URL);

// Every test starts from empty tables (migrations stay applied).
beforeEach(async () => {
  const db = requireDb();
  const { rows } = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
  await db.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`));
});

afterAll(async () => {
  await closeDbPool();
});
