import type { Metadata } from "next";
import { PendingApprovalCard } from "@/features/auth/pending-approval-card";

export const metadata: Metadata = {
  title: "Статус на кандидатурата | DOMORA",
  description: "Проверка на статуса на кандидатурата за специалист в DOMORA.",
};

export default function PendingApprovalPage() {
  return <PendingApprovalCard />;
}
