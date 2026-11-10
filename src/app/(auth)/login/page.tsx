import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { redirectIfSignedIn } from "@/features/auth/server/actor";

export const metadata: Metadata = {
  title: "Вход | DOMORA",
  description: "Вход в клиентския или специалист панел на DOMORA.",
};

export default async function LoginPage() {
  await redirectIfSignedIn();

  return <LoginForm />;
}
