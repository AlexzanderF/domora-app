import { Plan } from "./types";
import type { CategoryId, Tariffs } from "./types";

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
    const volumeMultiplier = visitsPerMonth >= 4 ? 0.9 : 1;
    return Math.round(
      quantity * tariffs[plan] * visitsPerMonth * volumeMultiplier,
    );
  }
  return serviceIndex > 0 ? 25 : tariffs.categories[category];
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
