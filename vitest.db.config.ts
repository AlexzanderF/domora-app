import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { TEST_DATABASE_URL } from "./tests/db/config";

// DB-backed tests: `npm run test:db`. Needs a Postgres at TEST_DATABASE_URL.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.db.test.ts"],
    environment: "node",
    env: { DATABASE_URL: TEST_DATABASE_URL, POSTGRES_PASSWORD: "" },
    globalSetup: ["tests/db/global-setup.ts"],
    setupFiles: ["tests/db/setup.ts"],
    // Files share one database, so they must not run concurrently.
    fileParallelism: false,
  },
});
