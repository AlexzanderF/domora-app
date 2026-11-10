import { Plan } from "@/domain/requests/types";
import type { CategoryId, Tariffs } from "@/domain/requests/types";

export const defaultTariffs: Tariffs = {
  categories: { 0: 45, 1: 35, 2: 55, 3: 25, 4: 65, 5: 25 },
  home: 1.5,
  entry: 18,
  diagnosticFee: 25,
  volumeDiscountMinVisits: 4,
  volumeDiscountPercent: 10,
};

// The `home` tariff is stored as an integer in tenths of a lev per m² (15 = 1.50).
export function homeRateToStored(home: number): number {
  return Math.round(home * 10);
}

export function homeRateFromStored(stored: number): number {
  return stored / 10;
}

export interface TariffRow {
  category: string;
  standardRate: number;
}

export interface PricingSettingsRow {
  diagnosticFee: number;
  volumeDiscountMinVisits: number;
  volumeDiscountPercent: number;
}

export function tariffsFromRows(
  rows: readonly TariffRow[],
  settings?: PricingSettingsRow | null,
): Tariffs {
  const result: Tariffs = {
    categories: { ...defaultTariffs.categories },
    home: defaultTariffs.home,
    entry: defaultTariffs.entry,
    diagnosticFee: settings?.diagnosticFee ?? defaultTariffs.diagnosticFee,
    volumeDiscountMinVisits:
      settings?.volumeDiscountMinVisits ??
      defaultTariffs.volumeDiscountMinVisits,
    volumeDiscountPercent:
      settings?.volumeDiscountPercent ?? defaultTariffs.volumeDiscountPercent,
  };

  for (const row of rows) {
    const categoryId = Number(row.category);
    if (Number.isInteger(categoryId) && categoryId >= 0 && categoryId <= 5) {
      result.categories[categoryId as CategoryId] = row.standardRate;
    } else if (row.category === "home") {
      result.home = homeRateFromStored(row.standardRate);
    } else if (row.category === "entry") {
      result.entry = row.standardRate;
    }
  }

  return result;
}

export function calculateQuote(
  tariffs: Tariffs,
  category: CategoryId,
  serviceIndex: number,
  plan?: Plan,
  quantity = 1,
  visitsPerMonth = 1,
): number {
  if (plan) {
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 1000) {
      throw new Error("Quantity must be between 1 and 1000.");
    }
    if (
      !Number.isInteger(visitsPerMonth) ||
      visitsPerMonth < 1 ||
      visitsPerMonth > 8
    ) {
      throw new Error("Monthly visits must be between 1 and 8.");
    }
    const volumeMultiplier =
      visitsPerMonth >= tariffs.volumeDiscountMinVisits
        ? (100 - tariffs.volumeDiscountPercent) / 100
        : 1;
    return Math.round(
      quantity * tariffs[plan] * visitsPerMonth * volumeMultiplier,
    );
  }
  return serviceIndex > 0
    ? tariffs.diagnosticFee
    : tariffs.categories[category];
}

export function quoteScope(
  category: CategoryId,
  serviceIndex: number,
  plan?: Plan,
) {
  if (plan)
    return plan === Plan.Home
      ? "2 почиствания месечно"
      : "Почистване веднъж седмично";
  return serviceIndex > 0 || category === 3 || category === 5
    ? "Цена само за оглед / диагностика. Ремонтът е с отделна оферта."
    : "Труд за избраната услуга. Материалите се заплащат отделно.";
}
