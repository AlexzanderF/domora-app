import { SkipLink } from "@/components/skip-link";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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
  "grid gap-2 border-b border-white/12 min-h-11 p-5 md:p-8 text-white no-underline";
const panelLabel = "text-xs font-[850] tracking-[0.12em] text-accent uppercase";
const panelValue = "text-lg md:text-2xl leading-[1.35]";

export default function ContactPage() {
  return (
    <div className="bg-[#f5f1e8] text-[#17362f]">
      <SkipLink />
      <SiteHeader />
      <PageContainer
        as="main"
        id="main"
        size="contact"
        className="min-h-[65dvh] pt-12 pb-16 md:pt-20 md:pb-24 md:min-h-[calc(100dvh-130px)]"
      >
        <section
          className="grid grid-cols-1 items-center gap-8 md:gap-12 lg:gap-16 lg:min-h-[min(620px,calc(100dvh-78px))] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.62fr)]"
          aria-labelledby="contact-title"
        >
          <div className="max-w-[760px]">
            <span className={eyebrow}>Контакти</span>
            <h1
              id="contact-title"
              className="mt-[0.9rem] mb-0 text-5xl leading-[0.95] md:text-7xl lg:text-8xl text-tone-102f29"
            >
              Говорете с DOMORA.
            </h1>
            <p className="mt-[1.4rem] mb-0 max-w-[600px] text-base md:text-xl leading-[1.65] text-[#4b6059]">
              За абонамент, активна заявка или въпрос към екипа, пишете ни с
              кратко описание и телефон за обратна връзка.
            </p>
          </div>

          <div className="order-first grid overflow-hidden rounded-[18px] bg-tone-102f29 lg:order-none shadow-[0_24px_60px_rgb(16_47_41/18%)]">
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
          className="grid grid-cols-1 border-y border-[#d8e1da] lg:grid-cols-3"
          aria-label="Информация за контакт"
        >
          {[
            ["Адрес", "София, бул. България 69, ет. 4"],
            ["Поддръжка", "За активни заявки влезте в клиентския профил."],
            ["Отговор", "Обработваме клиентски запитвания целогодишно."],
          ].map(([label, text]) => (
            <div
              key={label}
              className="min-w-0 px-5 py-5 md:py-8 not-first:border-t not-first:border-[#d8e1da] lg:not-first:border-t-0 lg:not-first:border-l"
            >
              <span className={eyebrow}>{label}</span>
              <p className="mt-[0.7rem] mb-0 text-base leading-[1.55] text-[#17362f]">
                {text}
              </p>
            </div>
          ))}
        </section>

        <section
          className="grid grid-cols-1 items-start gap-8 pt-12 md:gap-12 md:pt-20 lg:gap-16 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)]"
          aria-labelledby="message"
        >
          <div>
            <span className={eyebrow}>Запитване</span>
            <h2
              id="message"
              className="mt-[0.8rem] max-w-[520px] text-3xl leading-tight md:text-5xl lg:text-6xl text-tone-102f29"
            >
              Изпратете ни детайлите.
            </h2>
          </div>
          <div className="border-l-4 border-primary pl-4 md:pl-8">
            <p className="m-0 text-[1.08rem] leading-[1.7] text-[#4b6059]">
              Най-бързо ще ви насочим, ако включите услугата, адреса или района
              на имота и удобен часови диапазон за разговор.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="inline-flex min-h-12 w-full items-center justify-center px-[1.1rem] py-3 font-extrabold sm:w-auto"
              >
                <a href={`mailto:${contactEmail}?subject=Запитване към DOMORA`}>
                  Напишете имейл
                </a>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="inline-flex min-h-12 w-full items-center justify-center border-[#c8d4cd] px-[1.1rem] py-3 font-extrabold hover:border-primary hover:bg-white sm:w-auto"
              >
                <a href="/login">Към клиентски профил</a>
              </Button>
            </div>
          </div>
        </section>
      </PageContainer>
      <SiteFooter />
    </div>
  );
}
