import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PendingApprovalCard } from "@/features/auth/pending-approval-card";
import { UserRole, UserStatus } from "@/features/auth/types";
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
    if (user.role === UserRole.Client) {
      redirect("/client");
    }
    if (user.role === UserRole.Admin) {
      redirect("/admin");
    }
    if (
      user.role === UserRole.Specialist &&
      user.status === UserStatus.Active
    ) {
      redirect("/specialist");
    }
  }

  return <PendingApprovalCard />;
}
