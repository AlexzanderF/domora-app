import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupWizard } from "@/features/auth/signup-wizard";
import { redirectIfSignedIn } from "@/features/auth/server/actor";

export const metadata: Metadata = {
  title: "Регистрация | DOMORA",
  description:
    "Регистрация на клиентски профил или кандидатстване като специалист в DOMORA.",
};

export default async function SignUpPage() {
  await redirectIfSignedIn();

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
