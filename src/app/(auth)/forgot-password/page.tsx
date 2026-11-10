import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { redirectIfSignedIn } from "@/features/auth/server/actor";

export const metadata: Metadata = {
  title: "Забравена парола | DOMORA",
  description:
    "Възстановяване на забравена парола за достъп до профила ви в DOMORA.",
};

export default async function ForgotPasswordPage() {
  await redirectIfSignedIn();

  return <ForgotPasswordForm />;
}
