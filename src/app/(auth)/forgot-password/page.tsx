import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Забравена парола | DOMORA",
  description:
    "Възстановяване на забравена парола за достъп до профила ви в DOMORA.",
};

export default async function ForgotPasswordPage() {
  if (isDbConfigured) {
    const user = await getServerSession();
    if (user) {
      if (user.role === "ADMIN") {
        redirect("/admin");
      }
      if (user.role === "SPECIALIST") {
        redirect(
          user.status === "PENDING" ? "/pending-approval" : "/specialist",
        );
      }
      redirect("/client");
    }
  }

  return <ForgotPasswordForm />;
}
