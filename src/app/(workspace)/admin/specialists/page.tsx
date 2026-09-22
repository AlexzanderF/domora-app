import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { SpecialistsReview } from "@/features/admin/specialists-review";
import { findSpecialistApplications } from "@/features/admin/server/queries";
import { UserRole } from "@/features/auth/types";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Кандидатури на специалисти · Администрация DOMORA",
  description:
    "Преглед и одобрение на кандидатстващи специалисти в платформата DOMORA.",
};
export const dynamic = "force-dynamic";

export default async function AdminSpecialistsPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/login");
    }
    if (user.role !== UserRole.Admin) {
      redirect(user.role === UserRole.Specialist ? "/specialist" : "/client");
    }
  }

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
