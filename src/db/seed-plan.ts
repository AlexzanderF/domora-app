// Decides what the seed script may write. Reference data (tariffs) is always
// seeded; demo users, subscriptions and requests only outside production.

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export interface AdminBootstrapPlan {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface SeedPlan {
  demo: boolean;
  admin: AdminBootstrapPlan | null;
}

const ADMIN_VARS = [
  "ADMIN_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PHONE",
  "ADMIN_PASSWORD",
] as const;

export function resolveSeedPlan(
  env: Record<string, string | undefined>,
  args: readonly string[],
): SeedPlan {
  const production = env.NODE_ENV === "production";

  if (production && args.includes("--demo")) {
    throw new Error(
      "Refusing to seed demo data in production (NODE_ENV=production).",
    );
  }
  const demo = !production && !args.includes("--reference-only");
  if (demo && !isLocalDatabase(env.DATABASE_URL)) {
    throw new Error(
      "Refusing to seed demo data into a non-local database. Use --reference-only.",
    );
  }

  return { demo, admin: resolveAdmin(env) };
}

function resolveAdmin(
  env: Record<string, string | undefined>,
): AdminBootstrapPlan | null {
  const values = ADMIN_VARS.map((name) => env[name]?.trim() ?? "");
  if (values.every((value) => !value)) return null;

  const missing = ADMIN_VARS.filter((_, index) => !values[index]);
  if (missing.length > 0) {
    throw new Error(
      `Admin bootstrap needs all of ${ADMIN_VARS.join(", ")}; missing ${missing.join(", ")}.`,
    );
  }

  const [name, email, phone] = values;
  const password = env.ADMIN_PASSWORD ?? "";
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`,
    );
  }
  return { name, email, phone, password };
}

// Demo accounts share a known password, so they may only go to a local DB.
// An unset or unparsable URL counts as local; the caller rejects a missing one.
function isLocalDatabase(url: string | undefined): boolean {
  if (!url) return true;
  try {
    const host = new URL(url).hostname;
    return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host);
  } catch {
    return true;
  }
}
