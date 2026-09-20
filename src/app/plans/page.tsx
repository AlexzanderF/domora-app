import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { PlanCards } from "@/features/plans/plan-cards";

export const metadata: Metadata = { title: "Абонаменти" };

export default function PlansPage() {
  return (
    <>
      <PageHeading
        eyebrow="ГРИЖА, КОЯТО ПРОДЪЛЖАВА"
        title="Един дом. Или цял вход."
        description="Два отделни плана, съобразени с вашето пространство."
      />
      <PlanCards />
      <p className="notice">
        * Всички цени са демонстрационни. Ремонти, материали и извънредно
        почистване се оферират отделно. Изборът създава демо заявка за
        абонамент, без плащане.
      </p>
    </>
  );
}
