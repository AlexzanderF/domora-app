import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

const navLink =
  "flex flex-[1_0_auto] items-center justify-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[13px] leading-[1.3] whitespace-nowrap text-[#3e574f] no-underline hover:text-[#175246] md:flex-none md:justify-start md:gap-3 md:px-[14px] md:py-3 md:text-[15px]";

export function PlansHeader() {
  return (
    <header className="sticky top-0 z-20 block h-auto border-b border-border bg-[rgb(255_255_255/96%)] p-0 text-[14px] text-[#29453e] backdrop-blur-[12px]">
      <PageContainer
        as="nav"
        size="plans"
        className="mt-0 grid grid-cols-[1fr_auto] items-center gap-[0.8rem] overflow-x-auto py-3 [scrollbar-width:none] md:overflow-visible lg:min-h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:py-0"
        aria-label="Навигация за абонаменти"
      >
        <Link
          className="inline-flex items-center justify-self-start gap-[0.65rem] px-2.5 py-2 text-base leading-normal font-[850] tracking-[0.1em] whitespace-nowrap text-[#175246] no-underline sm:text-[1.2rem] sm:leading-[1.3] md:px-[14px] md:py-3"
          href="/"
          aria-label="DOMORA начало"
        >
          <span
            className="grid h-[2.15rem] w-[22px] shrink-0 place-items-center rounded-lg bg-[#175246] text-[18px] tracking-normal text-white"
            aria-hidden="true"
          >
            ⌂
          </span>
          DOMORA
        </Link>
        <div className="col-span-full row-start-2 flex items-center justify-center border-t border-[#e2e9e5] pt-[0.65rem] font-[650] lg:col-span-1 lg:row-start-1 lg:gap-7 lg:border-t-0 lg:pt-0">
          <Link className={navLink} href="/">
            Начало
          </Link>
          <Link className={navLink} href="/client/requests">
            Моите заявки
          </Link>
        </div>
        <Button
          asChild
          className="flex items-center justify-self-end gap-1.5 rounded-[7px] bg-[#175246] px-3 py-[0.55rem] text-[0.8rem] leading-[1.3] font-[750] whitespace-nowrap text-white no-underline hover:bg-[#175246] sm:px-4 sm:py-[0.68rem] md:gap-3 md:text-[15px]"
        >
          <Link href="/client">Към таблото</Link>
        </Button>
      </PageContainer>
    </header>
  );
}
