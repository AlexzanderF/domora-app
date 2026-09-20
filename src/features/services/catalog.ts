import type { CategoryId } from "@/features/requests/types";

export const categories: {
  id: CategoryId;
  name: string;
  services: string[];
  iconPath: string;
}[] = [
  {
    id: 0,
    name: "ВиК",
    services: ["Смяна на смесител", "Отстраняване на теч — оглед"],
    iconPath: "M7 3v5h10V3M12 8v7m-5 0h10v6H7z",
  },
  {
    id: 1,
    name: "Електро",
    services: ["Смяна на контакт", "Електрически проблем — диагностика"],
    iconPath: "m13 2-8 12h6l-1 8 9-13h-7z",
  },
  {
    id: 2,
    name: "Климатизация",
    services: ["Почистване на климатик", "Ремонт на климатик — диагностика"],
    iconPath: "M3 8h18V3H3zm3 4v4m6-4v8m6-8v4",
  },
  {
    id: 3,
    name: "Ремонти",
    services: ["Боядисване — оглед", "Ремонт на баня — оглед"],
    iconPath: "m14 5 5 5M3 21l9-9m-4-9 4 4 4-1 2-4 4 4-1 5-5 2-3 3-5-5-3-5z",
  },
  {
    id: 4,
    name: "Почистване",
    services: [
      "Почистване на дом до 80 м²",
      "Почистване на общи части — оглед",
    ],
    iconPath: "m12 3-3 9m-3 0h9l4 9H2zm-1 5h12",
  },
  {
    id: 5,
    name: "Други",
    services: ["Друга услуга — оглед"],
    iconPath: "M12 5v14M5 12h14",
  },
];

export const requestStages = [
  "Създадена",
  "Приета",
  "Специалистът пътува",
  "В процес",
  "Очаква потвърждение",
  "Завършена",
];

export function isCategoryId(value: number): value is CategoryId {
  return Number.isInteger(value) && value >= 0 && value < categories.length;
}
