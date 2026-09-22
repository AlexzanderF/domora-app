import type { ServiceRequest, Tariffs } from "./types";
import type { Subscription } from "@/features/subscriptions/types";
import { defaultPlanPrices } from "@/features/plans/pricing";
import { defaultServicePrices } from "@/features/services/pricing";

export const initialTariffs: Tariffs = {
  categories: { ...defaultServicePrices },
  ...defaultPlanPrices,
};

export function generateDemoId(): number {
  return Math.floor(Date.now() % 1_000_000_000);
}

export const initialSubscription: Subscription = {
  id: 1001,
  userId: 1,
  planType: "HOME",
  propertyAddress: "София · ул. Примерна 12, ет. 3, ап. 8",
  propertyArea: 85,
  status: "ACTIVE",
  visitsRemaining: 2,
  validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
};

export const initialRequests: ServiceRequest[] = [
  {
    id: 1001,
    category: 0,
    service: "Смяна на смесител",
    address: "София · ул. Примерна 12",
    date: "Демо посещение",
    time: "09:00–12:00",
    price: 45,
    status: 1,
    description: "Подмяна на смесителя в кухнята.",
    specialist: "Демо специалист · ВиК",
  },
  {
    id: 1002,
    category: 4,
    service: "Почистване на дом",
    address: "София · ул. Примерна 12",
    date: "Демо посещение",
    time: "12:00–15:00",
    price: 65,
    status: 4,
    description: "Почистване на апартамент до 80 м².",
    specialist: "Демо екип · Почистване",
    report: "Почистени подове, кухня и санитарни помещения.",
    subscriptionId: 1001,
  },
];
