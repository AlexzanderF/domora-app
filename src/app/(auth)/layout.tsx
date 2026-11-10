import { SkipLink } from "@/components/skip-link";
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
      <SkipLink />
      <LandingHeader />
      <div className="flex min-h-[calc(100dvh-78px)] flex-col items-center justify-center bg-background px-4 py-12">
        <main
          id="main"
          className="m-auto flex min-h-[65dvh] w-full max-w-[480px] scroll-mt-[72px] flex-col items-center px-[18px] py-6 md:min-h-[calc(100dvh-130px)] md:p-7 lg:px-11 lg:py-[38px] min-[1500px]:pt-[50px]"
        >
          <Card className="w-full rounded-2xl px-8 py-9 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            {children}
          </Card>
        </main>
      </div>
      <LandingFooter />
    </>
  );
}
