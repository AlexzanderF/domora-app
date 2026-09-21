import fs from "node:fs";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export type DomoraDatabase = NodePgDatabase<typeof schema>;

export function loadEnvFiles(): void {
  if (typeof process.loadEnvFile !== "function") return;
  if (process.env.NODE_ENV === "production") return;
  for (const envFile of [".env.local", ".env"]) {
    try {
      if (fs.existsSync(/* turbopackIgnore: true */ envFile)) {
        process.loadEnvFile(envFile);
      }
    } catch {
      // Ignore errors loading environment files
    }
  }
}

// Load env files if running in CLI script contexts where Next hasn't preloaded them
if (!process.env.DATABASE_URL) {
  loadEnvFiles();
}

export const isDbConfigured = Boolean(
  process.env.NEXT_STATIC_EXPORT !== "1" && process.env.DATABASE_URL?.trim(),
);

declare global {
  var __domora_pg_pool: pg.Pool | undefined;
  var __domora_drizzle_db: DomoraDatabase | undefined;
}

let prodPool: pg.Pool | null = null;
let prodDb: DomoraDatabase | null = null;

export function getDbPool(): pg.Pool | null {
  if (!isDbConfigured) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    if (!prodPool) {
      prodPool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }
    return prodPool;
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
    if (!prodDb) {
      const pool = getDbPool();
      if (pool) {
        prodDb = drizzle(pool, { schema });
      }
    }
    return prodDb;
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
  if (prodPool) {
    await prodPool.end();
    prodPool = null;
    prodDb = null;
  }
  if (globalThis.__domora_pg_pool) {
    await globalThis.__domora_pg_pool.end();
    globalThis.__domora_pg_pool = undefined;
    globalThis.__domora_drizzle_db = undefined;
  }
}

export const db = getDb();

export * from "./schema";
