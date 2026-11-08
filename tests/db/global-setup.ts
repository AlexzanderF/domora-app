import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { TEST_DATABASE_URL, assertTestDatabase } from "./config";

// Runs once per `vitest` run: bring the test database to the latest schema.
export default async function setup(): Promise<void> {
  assertTestDatabase(TEST_DATABASE_URL);
  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  } catch (error) {
    throw new Error(
      "Cannot migrate the test database. Is it running? Try `npm run test:db`.",
      { cause: error },
    );
  } finally {
    await pool.end();
  }
}
