import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { UserRole, UserStatus } from "@/features/auth/types";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Вход | DOMORA",
  description: "Вход в клиентския или специалист панел на DOMORA.",
};

export default async function LoginPage() {
  if (isDbConfigured) {
    const user = await getServerSession();
    if (user) {
      if (user.role === UserRole.Admin) {
        redirect("/admin");
      }
      if (user.role === UserRole.Specialist) {
        redirect(
          user.status === UserStatus.Pending
            ? "/pending-approval"
            : "/specialist",
        );
      }
      redirect("/client");
    }
  }

  return <LoginForm />;
}
