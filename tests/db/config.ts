// Defaults match compose.test.yaml; CI overrides via TEST_DATABASE_URL.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://domora_test:domora_test@localhost:5433/domora_test";

// Tests truncate every table, so refuse anything not clearly a test database.
export function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run DB tests against "${name}": database name must end with "_test".`,
    );
  }
}
