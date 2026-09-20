"use client";

import { useDemo } from "@/features/requests/demo-provider";
import { money } from "@/lib/format";
import type { Plan } from "@/features/requests/types";

const plans: {
  id: Plan;
  badge: string;
  title: string;
  description: string;
  quantity: number;
  example: string;
  features: string[];
}[] = [
  {
    id: "home",
    badge: "За домакинства",
    title: "За дома",
    description: "Редовно почистване на апартамент или къща.",
    quantity: 80,
    example: "Демо пример за 80 м²",
    features: [
      "2 почиствания месечно",
      "Подове и достъпни повърхности",
      "Кухня и санитарни помещения",
      "Отчет след всяко посещение",
      "История на услугите",
    ],
  },
  {
    id: "entry",
    badge: "За етажна собственост",
    title: "За входа",
    description: "Поддържани общи части по постоянен график.",
    quantity: 6,
    example: "Демо пример за 6 етажа · цена за целия вход",
    features: [
      "Почистване веднъж седмично",
      "Стълби и етажни площадки",
      "Входна врата и парапети",
      "Отчет след всяко посещение",
      "Контакт чрез представител на входа",
    ],
  },
];

export function PlanCards() {
  const { tariffs, openBooking } = useDemo();
  return (
    <div className="plans">
      {plans.map((plan) => (
        <div
          className={`card plancard ${plan.id === "home" ? "featured" : ""}`}
          key={plan.id}
        >
          <span className="badge">{plan.badge}</span>
          <h2>DOMORA {plan.title}</h2>
          <p className="muted">{plan.description}</p>
          <div className="planprice">
            {money(tariffs[plan.id] * plan.quantity)}{" "}
            <small className="muted">/ месец*</small>
          </div>
          <p className="muted">{plan.example}</p>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <button
            className="primary"
            onClick={() => openBooking({ category: 4, plan: plan.id })}
          >
            Избери „{plan.title}“ →
          </button>
        </div>
      ))}
    </div>
  );
}
