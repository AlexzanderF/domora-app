import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupWizard } from "@/features/auth/signup-wizard";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Регистрация | DOMORA",
  description:
    "Регистрация на клиентски профил или кандидатстване като специалист в DOMORA.",
};

export default async function SignUpPage() {
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
      redirect("/requests");
    }
  }

  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "40px" }}>Зареждане...</div>
      }
    >
      <SignupWizard />
    </Suspense>
  );
}
