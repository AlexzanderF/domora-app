import type { Metadata } from "next";
import { isDbConfigured } from "@/db";
import { isPasswordResetTokenValid } from "@/domain/identity";
import { ResetLinkInvalid } from "@/features/auth/reset-link-invalid";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Нова парола | DOMORA",
  description: "Задаване на нова парола за профила ви в DOMORA.",
  // The address carries the reset token: never send it on as a referrer.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;
  const isValid =
    isDbConfigured &&
    typeof token === "string" &&
    (await isPasswordResetTokenValid(token));

  return isValid ? <ResetPasswordForm token={token} /> : <ResetLinkInvalid />;
}
