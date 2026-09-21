import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PendingApprovalCard } from "@/features/auth/pending-approval-card";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Статус на кандидатурата | DOMORA",
  description: "Проверка на статуса на кандидатурата за специалист в DOMORA.",
};

export default async function PendingApprovalPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/login");
    }
    if (user.role === "CLIENT") {
      redirect("/client");
    }
    if (user.role === "ADMIN") {
      redirect("/admin");
    }
    if (user.role === "SPECIALIST" && user.status === "ACTIVE") {
      redirect("/specialist");
    }
  }

  return <PendingApprovalCard />;
}
