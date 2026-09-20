import type { ServiceRequest, Tariffs } from "./types";
import { defaultPlanPrices } from "@/features/plans/pricing";
import { defaultServicePrices } from "@/features/services/pricing";

export const initialTariffs: Tariffs = {
  categories: { ...defaultServicePrices },
  ...defaultPlanPrices,
};

export const initialRequests: ServiceRequest[] = [
  {
    id: "1001",
    category: 0,
    service: "Смяна на смесител",
    address: "София · ул. Примерна 12",
    date: "Демо посещение",
    time: "09:00–12:00",
    price: 45,
    status: 1,
    description: "Подмяна на смесителя в кухнята.",
    master: "Демо специалист · ВиК",
  },
  {
    id: "1002",
    category: 4,
    service: "Почистване на дом",
    address: "София · ул. Примерна 12",
    date: "Демо посещение",
    time: "12:00–15:00",
    price: 65,
    status: 4,
    description: "Почистване на апартамент до 80 м².",
    master: "Демо екип · Почистване",
    report: "Почистени подове, кухня и санитарни помещения.",
  },
];
