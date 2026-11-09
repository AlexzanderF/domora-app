import Link from "next/link";
import { Button } from "@/components/ui/button";

// `!` modifiers beat the legacy unlayered `header`, `nav`, `nav a` and
// `nav a span` rules in globals.css; drop them when the contract ticket
// removes those rules.
const navLink =
  "text-[#3e574f]! hover:text-[#175246]! flex! items-center gap-3 rounded-[9px] px-[14px] py-3 text-[15px] leading-[1.3] no-underline";

export function PlansHeader() {
  return (
    <header className="sticky top-0 z-30 block! h-auto! border-b border-[#dce5df] bg-[rgb(255_255_255/96%)]! p-0! text-[#29453e]! backdrop-blur-[12px]">
      <nav
        className="mx-auto! mt-0! grid! min-h-[76px] w-[min(1180px,calc(100%-3rem))]! grid-cols-[1fr_auto_1fr] items-center gap-8! max-[820px]:grid-cols-[1fr_auto]! max-[820px]:gap-[0.8rem]! max-[820px]:py-3! max-[520px]:w-[calc(100%-2rem)]!"
        aria-label="Навигация за абонаменти"
      >
        <Link
          className="inline-flex! items-center justify-self-start gap-[0.65rem]! px-[14px] py-3 text-[1.2rem]! font-[850] tracking-[0.1em] text-[#175246]! no-underline max-[520px]:text-base!"
          href="/"
          aria-label="DOMORA начало"
        >
          <span
            className="grid! h-[2.15rem] w-[22px]! place-items-center rounded-lg bg-[#175246] text-[18px]! tracking-normal text-white"
            aria-hidden="true"
          >
            ⌂
          </span>
          DOMORA
        </Link>
        <div className="flex items-center gap-7 font-[650] max-[820px]:col-span-full max-[820px]:row-start-2 max-[820px]:justify-center max-[820px]:border-t max-[820px]:border-[#e2e9e5] max-[820px]:pt-[0.65rem]">
          <Link className={navLink} href="/">
            Начало
          </Link>
          <Link className={navLink} href="/client/requests">
            Моите заявки
          </Link>
        </div>
        <Button
          asChild
          className="flex! justify-self-end rounded-[7px]! bg-[#175246]! px-4! py-[0.68rem]! font-[750] text-white! no-underline hover:bg-[#175246]! max-[520px]:px-3! max-[520px]:py-[0.55rem]! max-[520px]:text-[0.8rem]!"
        >
          <Link href="/client">Към таблото</Link>
        </Button>
      </nav>
    </header>
  );
}
