import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Вход | DOMORA",
  description: "Вход в клиентския или специалист панел на DOMORA.",
};

export default function LoginPage() {
  return <LoginForm />;
}
