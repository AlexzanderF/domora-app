import type { Metadata } from "next";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Вход и регистрация | DOMORA",
  description: "Вход и регистрация в платформата за грижа за дома DOMORA.",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <LandingHeader />
      <div className="flex min-h-[calc(100vh-78px)] flex-col items-center justify-center bg-background px-4 py-12">
        {/* max-w! beats the legacy global `main` rule until the contract ticket. */}
        <main
          id="main"
          className="flex w-full max-w-[480px]! flex-col items-center"
        >
          <Card className="w-full rounded-2xl px-8 py-9 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-[700px]:px-8 max-[700px]:py-9">
            {children}
          </Card>
        </main>
      </div>
      <LandingFooter />
    </>
  );
}
