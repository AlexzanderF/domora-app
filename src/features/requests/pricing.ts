import type { CategoryId, Plan, Tariffs } from "./types";

export function calculateQuote(
  tariffs: Tariffs,
  category: CategoryId,
  serviceIndex: number,
  plan?: Plan,
  quantity = 1,
): number {
  if (plan) {
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 1000) {
      throw new Error("Quantity must be between 1 and 1000.");
    }
    return Math.round(quantity * tariffs[plan]);
  }
  return serviceIndex > 0 ? 25 : tariffs.categories[category];
}

export function quoteScope(
  category: CategoryId,
  serviceIndex: number,
  plan?: Plan,
) {
  if (plan)
    return plan === "home"
      ? "2 почиствания месечно"
      : "Почистване веднъж седмично";
  return serviceIndex > 0 || category === 3 || category === 5
    ? "Цена само за оглед / диагностика. Ремонтът е с отделна оферта."
    : "Труд за избраната услуга. Материалите се заплащат отделно.";
}
