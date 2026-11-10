import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

const anchorLink =
  "flex flex-[1_0_auto] items-center justify-center gap-1.5 rounded-[9px] p-0 text-[13px] leading-[1.3] font-[650] whitespace-nowrap text-[#425750] no-underline hover:text-primary md:flex-none md:justify-start md:gap-3 md:text-[15px]";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 block h-auto text-[14px] text-muted-foreground border-b border-[#e0e7e2] bg-[rgb(255_255_255/94%)] p-0 backdrop-blur-[12px]">
      <PageContainer
        as="nav"
        className="mt-0 grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-[0.8rem] overflow-x-auto py-[0.85rem] [scrollbar-width:none] md:overflow-visible lg:min-h-[78px] lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:py-0"
        aria-label="Навигация на началната страница"
      >
        <Link
          className="inline-flex items-center justify-self-start gap-[0.65rem] p-0 text-base leading-normal font-[850] tracking-[0.12em] whitespace-nowrap text-primary no-underline sm:text-[1.25rem] sm:leading-[1.3]"
          href="/"
          aria-label="DOMORA начало"
        >
          <span
            className="grid h-8 w-auto shrink-0 place-items-center rounded-[10px] bg-primary text-[1.25rem] tracking-normal text-white sm:h-[2.2rem] md:w-[22px]"
            aria-hidden="true"
          >
            ⌂
          </span>
          DOMORA
        </Link>
        <div className="col-span-full row-start-2 flex items-center justify-center gap-4 border-t border-[#e7ece8] pt-[0.7rem] sm:gap-8 lg:col-span-1 lg:row-start-1 lg:gap-6 lg:border-t-0 lg:pt-0">
          <Link className={anchorLink} href="/#how-it-works">
            Как работи
          </Link>
          <Link className={anchorLink} href="/#services">
            Услуги
          </Link>
          <Link className={anchorLink} href="/#faq">
            ЧЗВ
          </Link>
          <Link className={anchorLink} href="/contact">
            Контакти
          </Link>
        </div>
        <div className="flex items-center justify-self-end gap-[0.35rem] sm:gap-[0.6rem]">
          <Button
            asChild
            variant="secondary"
            className="inline-flex min-h-[38px] flex-[1_0_auto] items-center justify-center gap-1.5 rounded-lg border border-[#d7e0da] bg-white px-[0.65rem] py-[0.45rem] text-[13px] leading-[1.3] font-[750] whitespace-nowrap text-[#425750] no-underline hover:text-primary sm:min-h-[42px] sm:px-4 sm:py-[0.55rem] md:flex-none md:gap-3 md:text-[15px]"
          >
            <Link href="/login">Вход</Link>
          </Button>
          <Button
            asChild
            className="inline-flex min-h-[38px] flex-[1_0_auto] items-center justify-center gap-1.5 rounded-lg bg-primary px-[0.65rem] py-[0.45rem] text-[13px] leading-[1.3] font-[750] whitespace-nowrap text-white no-underline hover:bg-[#123e34] sm:min-h-[42px] sm:px-4 sm:py-[0.55rem] md:flex-none md:gap-3 md:text-[15px]"
          >
            <Link href="/signup">Регистрация</Link>
          </Button>
        </div>
      </PageContainer>
    </header>
  );
}
