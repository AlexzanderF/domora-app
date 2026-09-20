import type { ServiceRequest, Tariffs } from "./types";

export const initialTariffs: Tariffs = {
  categories: { 0: 45, 1: 35, 2: 55, 3: 25, 4: 65, 5: 25 },
  home: 1.5,
  entry: 18,
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
