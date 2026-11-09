import type { CategoryId } from "@/domain/requests/types";
import { defaultTariffs } from "@/domain/pricing";
import { categories } from "./catalog";

function getCategory(categoryId: CategoryId) {
  const category = categories.find(({ id }) => id === categoryId);
  if (!category) {
    throw new Error(`Unknown service category: ${categoryId}`);
  }
  return category;
}

export const landingServiceHighlights = [
  {
    category: getCategory(4),
    title: "Основно почистване",
    description:
      "Цялостна грижа за подове, кухня и санитарни помещения от подбран екип.",
    startingPrice: defaultTariffs.categories[4],
    pricePrefix: "от",
    action: { type: "booking", label: "Заяви услуга" } as const,
  },
  {
    category: getCategory(4),
    title: "Поддръжка на вход",
    description:
      "Редовен график за чисти и приветливи общи части през целия месец.",
    startingPrice: defaultTariffs.entry,
    pricePrefix: "от",
    priceSuffix: "/ етаж",
    action: { type: "link", label: "Избери план", href: "/plans" } as const,
  },
  {
    category: getCategory(3),
    title: "Домашни ремонти",
    description:
      "Надеждна помощ за малки ремонти и подобрения с ясна оферта предварително.",
    startingPrice: defaultTariffs.categories[3],
    pricePrefix: "оглед от",
    action: { type: "booking", label: "Заяви услуга" } as const,
  },
];
