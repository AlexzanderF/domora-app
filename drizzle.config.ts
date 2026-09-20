import fs from "node:fs";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  for (const envFile of [".env.local", ".env"]) {
    try {
      if (fs.existsSync(envFile)) {
        process.loadEnvFile(envFile);
      }
    } catch {
      // Ignore errors loading environment files
    }
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
