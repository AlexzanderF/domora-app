import { getDb, requireDb, tariffs } from "@/db";
import { can, type Actor } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import type { CategoryId, Tariffs } from "@/domain/requests/types";
import { defaultTariffs, homeRateToStored, tariffsFromRows } from "./index";

// Server-only (reads the database); kept apart from ./index so client
// components can import the pure quote functions without bundling `pg`.
export async function findTariffs(): Promise<Tariffs> {
  const db = getDb();
  if (!db) return defaultTariffs;
  return tariffsFromRows(await db.select().from(tariffs));
}

export type PricingErrorCode =
  "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_INPUT";

export class PricingError extends Error {
  constructor(
    readonly code: PricingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PricingError";
  }
}

const CATEGORY_IDS: readonly CategoryId[] = [0, 1, 2, 3, 4, 5];

function isWholeRate(value: unknown, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= max
  );
}

// Admin-only. Writes every rate and a `tariffs.updated` outbox event in one
// transaction. Rates are whole euros; the Home rate is euros per m² with one
// decimal and is stored in tenths (see homeRateToStored).
export async function saveTariffs(
  actor: Actor | null,
  input: Tariffs,
): Promise<void> {
  if (!actor) throw new PricingError("UNAUTHENTICATED", "Sign in required.");
  if (!can(actor, "tariffs.update")) {
    throw new PricingError("FORBIDDEN", "Admin rights required.");
  }

  const home = homeRateToStored(input.home);
  const valid =
    CATEGORY_IDS.every((id) => isWholeRate(input.categories[id], 10000)) &&
    isWholeRate(input.entry, 1000) &&
    Number.isFinite(input.home) &&
    home >= 1 &&
    home <= 1000;
  if (!valid) throw new PricingError("INVALID_INPUT", "Invalid tariff rates.");

  const rows = [
    ...CATEGORY_IDS.map((id) => ({
      category: String(id),
      standardRate: input.categories[id],
    })),
    { category: "home", standardRate: home },
    { category: "entry", standardRate: input.entry },
  ];

  await requireDb().transaction(async (tx) => {
    const updatedAt = new Date();
    for (const row of rows) {
      await tx
        .insert(tariffs)
        .values({ ...row, updatedAt })
        .onConflictDoUpdate({
          target: tariffs.category,
          set: { standardRate: row.standardRate, updatedAt },
        });
    }
    await enqueueEvent(tx, {
      type: "tariffs.updated",
      payload: { actorId: actor.id, tariffs: input },
    });
  });
}
