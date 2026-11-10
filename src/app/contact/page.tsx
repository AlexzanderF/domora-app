import { SkipLink } from "@/components/skip-link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";

export const metadata: Metadata = {
  title: "Контакти | DOMORA",
  description:
    "Свържете се с DOMORA за домашни услуги, абонаменти и клиентска поддръжка.",
};

const phone = "+359 2 492 00 24";
const contactEmail = "hello@domora.bg";

const eyebrow =
  "inline-flex text-xs font-[850] tracking-[0.14em] text-primary uppercase";
const panelRow =
  "grid gap-2 border-b border-white/12 p-[clamp(1.25rem,3vw,2rem)] text-white no-underline";
const panelLabel = "text-xs font-[850] tracking-[0.12em] text-accent uppercase";
const panelValue = "text-[clamp(1.15rem,2.4vw,1.55rem)] leading-[1.35]";

export default function ContactPage() {
  return (
    <div className="bg-[#f5f1e8] text-[#17362f]">
      <SkipLink />
      <LandingHeader />
      <main
        id="main"
        className="mx-auto min-h-[calc(100vh-130px)] max-[700px]:min-h-[65vh] w-[min(1240px,calc(100%-3rem))] max-w-none px-0 pt-[clamp(3rem,7vw,6rem)] pb-[clamp(4rem,9vw,7rem)] max-[560px]:w-[calc(100%-2rem)]"
      >
        <section
          className="grid min-h-[min(620px,calc(100vh-78px))] grid-cols-[minmax(0,1fr)_minmax(360px,0.62fr)] items-center gap-[clamp(2rem,5vw,5rem)] max-[900px]:min-h-0 max-[900px]:grid-cols-1 max-[560px]:gap-8"
          aria-labelledby="contact-title"
        >
          <div className="max-w-[760px]">
            <span className={eyebrow}>Контакти</span>
            <h1
              id="contact-title"
              className="mt-[0.9rem] mb-0 text-[clamp(3.2rem,9vw,7.4rem)] leading-[0.9] text-tone-102f29"
            >
              Говорете с DOMORA.
            </h1>
            <p className="mt-[1.4rem] mb-0 max-w-[600px] text-[clamp(1.05rem,2vw,1.28rem)] leading-[1.65] text-[#4b6059]">
              За абонамент, активна заявка или въпрос към екипа, пишете ни с
              кратко описание и телефон за обратна връзка.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-[18px] bg-tone-102f29 shadow-[0_24px_60px_rgb(16_47_41/18%)]">
            <a className={`${panelRow} hover:bg-white/6`} href={`tel:${phone}`}>
              <span className={panelLabel}>Телефон</span>
              <strong className={panelValue}>{phone}</strong>
            </a>
            <a
              className={`${panelRow} hover:bg-white/6`}
              href={`mailto:${contactEmail}`}
            >
              <span className={panelLabel}>Имейл</span>
              <strong className={panelValue}>{contactEmail}</strong>
            </a>
            <div className={`${panelRow} border-b-0`}>
              <span className={panelLabel}>Обслужване</span>
              <strong className={panelValue}>
                Ежедневна клиентска поддръжка
              </strong>
            </div>
          </div>
        </section>

        <section
          className="grid grid-cols-3 border-y border-[#d8e1da] max-[900px]:grid-cols-1"
          aria-label="Информация за контакт"
        >
          {[
            ["Адрес", "София, бул. България 69, ет. 4"],
            ["Поддръжка", "За активни заявки влезте в клиентския профил."],
            ["Отговор", "Обработваме клиентски запитвания целогодишно."],
          ].map(([label, text]) => (
            <div
              key={label}
              className="min-w-0 px-5 py-[clamp(1.25rem,3vw,2rem)] not-first:border-l not-first:border-[#d8e1da] max-[900px]:not-first:border-t max-[900px]:not-first:border-l-0"
            >
              <span className={eyebrow}>{label}</span>
              <p className="mt-[0.7rem] mb-0 text-base leading-[1.55] text-[#17362f]">
                {text}
              </p>
            </div>
          ))}
        </section>

        <section
          className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] items-start gap-[clamp(2rem,5vw,5rem)] pt-[clamp(3rem,7vw,5.5rem)] max-[900px]:grid-cols-1"
          aria-labelledby="message"
        >
          <div>
            <span className={eyebrow}>Запитване</span>
            <h2
              id="message"
              className="mt-[0.8rem] max-w-[520px] text-[clamp(2.1rem,5vw,4rem)] leading-none text-tone-102f29"
            >
              Изпратете ни детайлите.
            </h2>
          </div>
          <div className="border-l-4 border-primary pl-[clamp(1rem,3vw,2rem)]">
            <p className="m-0 text-[1.08rem] leading-[1.7] text-[#4b6059]">
              Най-бързо ще ви насочим, ако включите услугата, адреса или района
              на имота и удобен часови диапазон за разговор.
            </p>
            <div className="mt-7 flex flex-wrap gap-[0.8rem] max-[560px]:flex-col">
              <Button
                asChild
                className="inline-flex min-h-12 items-center justify-center px-[1.1rem] py-3 font-extrabold"
              >
                <a href={`mailto:${contactEmail}?subject=Запитване към DOMORA`}>
                  Напишете имейл
                </a>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="inline-flex min-h-12 items-center justify-center border-[#c8d4cd] px-[1.1rem] py-3 font-extrabold hover:border-primary hover:bg-white"
              >
                <a href="/login">Към клиентски профил</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
