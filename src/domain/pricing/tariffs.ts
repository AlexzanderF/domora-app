import { getDb, pricingSettings, requireDb, tariffs } from "@/db";
import { can, type Actor } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import type { CategoryId, Tariffs } from "@/domain/requests/types";
import { defaultTariffs, homeRateToStored, tariffsFromRows } from "./index";
import { DomainError } from "@/domain/errors";

// Server-only (reads the database); kept apart from ./index so client
// components can import the pure quote functions without bundling `pg`.
export async function findTariffs(): Promise<Tariffs> {
  const db = getDb();
  if (!db) return defaultTariffs;
  const [rows, [settings]] = await Promise.all([
    db.select().from(tariffs),
    db.select().from(pricingSettings),
  ]);
  return tariffsFromRows(rows, settings);
}

export type PricingErrorCode =
  "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_INPUT";

export class PricingError extends DomainError<PricingErrorCode> {}

const CATEGORY_IDS: readonly CategoryId[] = [0, 1, 2, 3, 4, 5];

function isWholeNumber(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function isWholeRate(value: unknown, max: number): value is number {
  return isWholeNumber(value, 1, max);
}

// Admin-only. Writes every rate, the pricing settings and a `tariffs.updated` outbox event in one
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
    home <= 1000 &&
    isWholeRate(input.diagnosticFee, 10000) &&
    isWholeNumber(input.volumeDiscountMinVisits, 1, 8) &&
    isWholeNumber(input.volumeDiscountPercent, 0, 100);
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
    const settings = {
      diagnosticFee: input.diagnosticFee,
      volumeDiscountMinVisits: input.volumeDiscountMinVisits,
      volumeDiscountPercent: input.volumeDiscountPercent,
    };
    await tx
      .insert(pricingSettings)
      .values({ id: 1, ...settings, updatedAt })
      .onConflictDoUpdate({
        target: pricingSettings.id,
        set: { ...settings, updatedAt },
      });
    await enqueueEvent(tx, {
      type: "tariffs.updated",
      payload: { actorId: actor.id, tariffs: input },
    });
  });
}
