import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { loadEnvFiles } from "./index";

loadEnvFiles();

const { Pool } = pg;

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL environment variable is required to run migrations.",
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    password: process.env.POSTGRES_PASSWORD?.trim() || undefined,
    max: 1,
  });

  const db = drizzle(pool);

  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void runMigrations();
