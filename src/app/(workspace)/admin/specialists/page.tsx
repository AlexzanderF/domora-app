import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { SpecialistsReview } from "@/features/admin/specialists-review";
import { findSpecialistApplications } from "@/features/admin/server/queries";

export const metadata: Metadata = {
  title: "Кандидатури на специалисти · Администрация DOMORA",
  description:
    "Преглед и одобрение на кандидатстващи специалисти в платформата DOMORA.",
};

export default async function AdminSpecialistsPage() {
  const initialSpecialists = await findSpecialistApplications();

  return (
    <>
      <PageHeading
        eyebrow="ДЕМО РАБОТНО ПРОСТРАНСТВО"
        title="Кандидатури на специалисти"
        description="Прегледайте подадените заявления от кандидатстващи специалисти и вземете решение за одобрение или отказ."
      />
      <SpecialistsReview initialSpecialists={initialSpecialists} />
    </>
  );
}
