import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export type DomoraDatabase = NodePgDatabase<typeof schema>;

export const isDbConfigured = Boolean(
  process.env.NEXT_STATIC_EXPORT !== "1" && process.env.DATABASE_URL?.trim(),
);

declare global {
  var __domora_pg_pool: pg.Pool | undefined;
  var __domora_drizzle_db: DomoraDatabase | undefined;
}

export function getDbPool(): pg.Pool | null {
  if (!isDbConfigured) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  if (!globalThis.__domora_pg_pool) {
    globalThis.__domora_pg_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalThis.__domora_pg_pool;
}

export function getDb(): DomoraDatabase | null {
  if (!isDbConfigured) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    const pool = getDbPool();
    return pool ? drizzle(pool, { schema }) : null;
  }

  if (!globalThis.__domora_drizzle_db) {
    const pool = getDbPool();
    if (pool) {
      globalThis.__domora_drizzle_db = drizzle(pool, { schema });
    }
  }

  return globalThis.__domora_drizzle_db ?? null;
}

export function requireDb(): DomoraDatabase {
  const instance = getDb();
  if (!instance) {
    throw new Error(
      "Database is not configured or running in static export mode. Provide a valid DATABASE_URL to enable database connectivity.",
    );
  }
  return instance;
}

export async function closeDbPool(): Promise<void> {
  if (globalThis.__domora_pg_pool) {
    await globalThis.__domora_pg_pool.end();
    globalThis.__domora_pg_pool = undefined;
    globalThis.__domora_drizzle_db = undefined;
  }
}

export const db = getDb();

export * from "./schema";
