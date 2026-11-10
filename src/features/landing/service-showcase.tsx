import Link from "next/link";
import { BookingCta } from "@/features/bookings/booking-cta";
import { landingServiceHighlights } from "@/features/services/landing-catalog";
import { ServiceIcon } from "@/features/services/service-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { money } from "@/lib/format";

const cardAction =
  "mt-[0.8rem] cursor-pointer border-0 bg-transparent p-0 font-[750] text-primary no-underline hover:underline hover:underline-offset-4";

export function ServiceShowcase() {
  return (
    <section
      id="services"
      className="scroll-mt-34 py-[clamp(2.5rem,5vw,4.25rem)]"
      aria-labelledby="services-title"
    >
      <div className="mb-[1.65rem] flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="mt-0 mb-[0.65rem] text-xs font-extrabold tracking-[0.15em] text-primary">
            ЗА ВСЕКИ ДОМ
          </p>
          <h2
            id="services-title"
            className="text-[clamp(2rem,4vw,3.25rem)] tracking-[-0.035em]"
          >
            Услуги и абонаменти
          </h2>
        </div>
        <p className="m-0 max-w-[500px] text-[#61726c]">
          Изберете еднократна помощ или постоянна грижа с предвидим график и
          цена.
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {landingServiceHighlights.map((highlight) => (
          <li key={highlight.title} className="min-w-0">
            <Card className="flex h-full flex-col items-start rounded-[18px] border-[#dbe4de] p-[clamp(1.15rem,2.4vw,1.6rem)]">
              <div
                className="mb-[1.15rem] grid size-[3.4rem] place-items-center rounded-[14px] bg-[#eaf2ec] [&_svg]:size-[1.8rem] [&_svg]:stroke-primary"
                aria-hidden="true"
              >
                <ServiceIcon category={highlight.category.id} />
              </div>
              <span className="text-xs font-extrabold tracking-[0.12em] text-[#718079] uppercase">
                {highlight.category.name}
              </span>
              <h3 className="mt-[0.45rem] text-[1.25rem]">{highlight.title}</h3>
              <p className="mt-[0.65rem] mb-4 flex-1 text-[0.94rem] text-[#63736d]">
                {highlight.description}
              </p>
              <strong className="text-[1.05rem] text-primary">
                {highlight.pricePrefix} {money(highlight.startingPrice)}{" "}
                {highlight.priceSuffix}
              </strong>
              {highlight.action.type === "booking" ? (
                <BookingCta
                  category={highlight.category.id}
                  className={cardAction}
                >
                  {highlight.action.label} →
                </BookingCta>
              ) : (
                <Link href={highlight.action.href} className={cardAction}>
                  {highlight.action.label} →
                </Link>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col items-start justify-between gap-8 rounded-[18px] bg-[#174c41] p-[clamp(1.15rem,2.7vw,1.8rem)] text-white md:flex-row md:items-center">
        <div>
          <span className="text-xs font-[850] tracking-[0.14em]">
            ПО-МАЛКО ЗАДАЧИ. ПОВЕЧЕ ВРЕМЕ.
          </span>
          <h3 className="mt-[0.4rem] text-[clamp(1.35rem,3vw,2rem)]">
            Спестете до 20% с месечен абонамент
          </h3>
          <p className="mt-[0.65rem] mb-0 max-w-[650px]">
            Един график, познат екип и предвидима месечна цена — без ново
            търсене при всяко посещение.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="grid min-w-[210px] gap-[0.15rem] rounded-[10px] border border-accent/28 bg-white/12 px-[0.9rem] py-3 text-xs font-[850] tracking-[0.14em]">
              <small className="text-xs font-bold">Еднократни посещения</small>
              <strong className="text-[0.86rem]">
                Стандартна цена при всяка заявка
              </strong>
            </span>
            <span className="grid min-w-[210px] gap-[0.15rem] rounded-[10px] border border-accent/28 bg-white/12 px-[0.9rem] py-3 text-xs font-[850] tracking-[0.14em]">
              <small className="text-xs font-bold">Месечен абонамент</small>
              <strong className="text-[0.86rem]">
                До 20% по-ниска обща цена
              </strong>
            </span>
          </div>
        </div>
        <Button
          asChild
          className="w-full shrink-0 rounded-[9px] bg-accent px-[1.2rem] py-[0.85rem] text-center font-[750] text-[#17362f] hover:bg-[#e5f6a3] md:w-auto"
        >
          <Link href="/plans">Разгледай абонаментите</Link>
        </Button>
      </div>
    </section>
  );
}
