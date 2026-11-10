import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";

const columnLink =
  "text-[#dce8e4] no-underline hover:text-white hover:underline hover:underline-offset-4";
const columnTitle =
  "mb-1 text-xs font-bold tracking-[0.08em] text-accent uppercase";

export function LandingFooter() {
  return (
    <footer className="block bg-[#102f29] py-12 text-[0.9rem] text-white md:py-16 lg:py-20">
      <PageContainer>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-16">
          <div>
            <Link
              href="/"
              className="text-[1.3rem] font-[850] tracking-[0.12em] text-white no-underline"
            >
              DOMORA
            </Link>
            <p className="mt-4 mb-0 max-w-[290px] text-[#b9cec7]">
              Надеждна грижа за дома, когато имате нужда от нея.
            </p>
          </div>
          <div className="flex flex-col items-start gap-[0.7rem]">
            <strong className={columnTitle}>Разгледайте</strong>
            <Link className={columnLink} href="/#how-it-works">
              Как работи
            </Link>
            <Link className={columnLink} href="/#services">
              Услуги
            </Link>
            <Link className={columnLink} href="/plans">
              Абонаменти
            </Link>
            <Link className={columnLink} href="/contact">
              Контакти
            </Link>
          </div>
          <div className="flex flex-col items-start gap-[0.7rem]">
            <strong className={columnTitle}>Контакти</strong>
            <a className={columnLink} href="tel:+35924920024">
              +359 2 492 00 24
            </a>
            <a className={columnLink} href="mailto:hello@domora.bg">
              hello@domora.bg
            </a>
          </div>
          <div className="flex flex-col items-start gap-[0.7rem]">
            <strong className={columnTitle}>Правна информация</strong>
            <Link className={columnLink} href="/terms">
              Условия за ползване
            </Link>
            <Link className={columnLink} href="/privacy">
              Поверителност
            </Link>
          </div>
        </div>
        <div className="mt-12 flex justify-between gap-4 border-t border-white/15 pt-6 text-xs text-[#9db6ae] flex-col sm:flex-row">
          <span>DOMORA © 2026</span>
          <span>Грижа за дома с ясен стандарт.</span>
        </div>
      </PageContainer>
    </footer>
  );
}
