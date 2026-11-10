import { SkipLink } from "@/components/skip-link";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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
      <SiteHeader variant="auth" />
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center bg-background px-4 py-6 sm:justify-center sm:py-12">
        <main
          id="main"
          className="w-full max-w-[480px] scroll-mt-[72px] bg-transparent sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:px-8 sm:py-9 sm:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          {children}
        </main>
      </div>
      <footer className="bg-[#102f29] px-4 py-2 text-center text-xs text-[#b9cec7] sm:hidden">
        <span>DOMORA © 2026</span>
        {" · "}
        <Link
          href="/terms"
          className="inline-flex min-h-11 items-center text-[#dce8e4] underline-offset-4 hover:underline"
        >
          Условия
        </Link>
        {" · "}
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center text-[#dce8e4] underline-offset-4 hover:underline"
        >
          Поверителност
        </Link>
      </footer>
      <div className="hidden sm:block">
        <SiteFooter />
      </div>
    </>
  );
}
