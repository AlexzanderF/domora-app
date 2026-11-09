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
      <div className="flex min-h-[calc(100vh-78px)] flex-col items-center justify-center bg-background px-4 py-12">
        <main
          id="main"
          className="m-auto flex min-h-[calc(100vh-130px)] w-full max-w-[480px] scroll-mt-[72px] flex-col items-center px-11 py-[38px] min-[1500px]:pt-[50px] max-[1100px]:p-7 max-[700px]:min-h-[65vh] max-[700px]:px-[18px] max-[700px]:py-6"
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
