import Link from "next/link";
import { Button } from "@/components/ui/button";

// `!` modifiers beat the legacy unlayered `header`, `nav` and `nav a` element
// rules in globals.css; drop them when the contract ticket removes those rules.
const anchorLink = "p-0! text-[#425750]! font-[650] hover:text-primary!";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 block! h-auto! border-b border-[#e0e7e2] bg-[rgb(255_255_255/94%)]! p-0! backdrop-blur-[12px]">
      <nav
        className="mx-auto! mt-0! grid! min-h-[78px] w-[min(1320px,calc(100%-3rem))]! grid-cols-[1fr_auto_1fr] items-center gap-8! max-[850px]:grid-cols-[1fr_auto]! max-[850px]:gap-x-5! max-[850px]:gap-y-[0.8rem]! max-[850px]:py-[0.85rem]! max-[560px]:w-[calc(100%-2rem)]!"
        aria-label="Навигация на началната страница"
      >
        <Link
          className="inline-flex! items-center justify-self-start gap-[0.65rem]! p-0! text-[1.25rem]! font-[850] tracking-[0.12em] text-primary! max-[560px]:text-base!"
          href="/"
          aria-label="DOMORA начало"
        >
          <span
            className="grid! size-[2.2rem] place-items-center rounded-[10px] bg-primary text-[1.25rem]! tracking-normal text-white max-[560px]:size-8"
            aria-hidden="true"
          >
            ⌂
          </span>
          DOMORA
        </Link>
        <div className="flex items-center gap-6 max-[850px]:col-span-full max-[850px]:row-start-2 max-[850px]:justify-center max-[850px]:gap-[clamp(1rem,8vw,2rem)] max-[850px]:border-t max-[850px]:border-[#e7ece8] max-[850px]:pt-[0.7rem]">
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
        <div className="flex items-center justify-self-end gap-[0.6rem] max-[560px]:gap-[0.35rem]">
          <Button
            asChild
            variant="secondary"
            className="inline-flex! min-h-[42px] items-center justify-center rounded-lg! border! border-[#d7e0da]! bg-white! px-4! py-[0.55rem]! font-[750] text-[#425750]! hover:text-primary! max-[560px]:min-h-[38px] max-[560px]:px-[0.65rem]! max-[560px]:py-[0.45rem]! max-[560px]:text-[0.78rem]"
          >
            <Link href="/login">Вход</Link>
          </Button>
          <Button
            asChild
            className="inline-flex! min-h-[42px] items-center justify-center rounded-lg! bg-primary! px-4! py-[0.55rem]! font-[750] text-white! hover:bg-[#123e34]! max-[560px]:min-h-[38px] max-[560px]:px-[0.65rem]! max-[560px]:py-[0.45rem]! max-[560px]:text-[0.78rem]"
          >
            <Link href="/signup">Регистрация</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
