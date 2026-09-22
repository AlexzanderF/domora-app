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
    priority: "STANDARD",
    description: "Подмяна на смесителя в кухнята.",
    specialist: "Демо специалист · ВиК",
    specialistPhone: "+359 88 123 4567",
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
    priority: "STANDARD",
    description: "Почистване на апартамент до 80 м².",
    specialist: "Демо екип · Почистване",
    specialistPhone: "+359 88 987 6543",
    report: "Почистени подове, кухня и санитарни помещения.",
    subscriptionId: 1001,
  },
  {
    id: 1003,
    category: 1,
    service: "Късо съединение в главното табло",
    address: "София · бул. Витоша 45, ет. 2",
    date: "Днес",
    time: "Спешно",
    price: 85,
    status: 0,
    priority: "URGENT",
    description: "Искри от главното ел. табло и прекъснато захранване.",
  },
  {
    id: 1004,
    category: 2,
    service: "Профилактика на климатик",
    address: "София · ж.к. Младост 1, бл. 102",
    date: "Днес",
    time: "10:00",
    price: 90,
    status: 5,
    priority: "STANDARD",
    description:
      "Годишна профилактика, почистване на филтри и тест на налягане.",
    specialist: "Демо специалист · Климатизация",
    report: "Климатикът е почистен и презареден, функционира изправно.",
  },
  {
    id: 1005,
    category: 3,
    service: "Боядисване на детска стая",
    address: "София · ул. Раковски 88",
    date: "Вчера",
    time: "14:00",
    price: 120,
    status: 4,
    priority: "STANDARD",
    description: "Боядисване на стени в детска стая, около 18 м².",
    specialist: "Демо специалист · Ремонти",
    clientName: "Демо клиент · Раковски 88",
    clientPhone: "+359 88 456 7890",
    report: "Стените са боядисани в избрания цвят, работата е приключена.",
    issue: true,
  },
];
