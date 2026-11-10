import { Card } from "@/components/ui/card";
import { LandingIcon } from "./landing-icon";

const testimonials = [
  {
    initials: "МП",
    name: "Мария Петрова",
    context: "Абонамент за дома",
    quote:
      "Екипът идва точно навреме, а след всяко посещение знам какво е свършено. Домът ни най-после има постоянен ритъм.",
  },
  {
    initials: "НИ",
    name: "Николай Иванов",
    context: "Домашен ремонт",
    quote:
      "Получих ясна цена предварително и специалистът остави всичко чисто. Нямаше изненади и губене на време.",
  },
  {
    initials: "ЕЛ",
    name: "Елена Лазарова",
    context: "Поддръжка на вход",
    quote:
      "Общите части са поддържани по график и вече не напомняме за всяко посещение. Комуникацията е спокойна и лесна.",
  },
];

const benefits = [
  {
    title: "Застраховка на имуществото",
    description:
      "Услугите са покрити, за да сте спокойни за дома си по време на всяко посещение.",
    icon: "M12 3 5 6v5c0 4.4 3 7.7 7 10 4-2.3 7-5.6 7-10V6l-7-3Z",
  },
  {
    title: "Фиксирани прозрачни цени",
    description:
      "Виждате обхвата и цената преди потвърждение, без скрити такси след работата.",
    icon: "M4 6h16v12H4V6Zm4 4h8m-8 4h5",
  },
  {
    title: "Проверени специалисти с рейтинг",
    description:
      "Всеки изпълнител минава проверка, а обратната връзка помага да пазим висок стандарт.",
    icon: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z",
  },
];

const questions = [
  {
    question: "Как се извършва плащането?",
    answer:
      "Плащате сигурно след потвърждение на услугата. Винаги виждате крайната цена и обхвата предварително.",
  },
  {
    question: "Какво става, ако трябва да сменя деня?",
    answer:
      "Можете да заявите промяна през профила си. Ще предложим най-близкия свободен час според графика на специалиста.",
  },
  {
    question: "Включени ли са препаратите?",
    answer:
      "При абонаментното почистване стандартните препарати са включени. За специални повърхности уточняваме нужните продукти предварително.",
  },
];

const eyebrow =
  "mt-0 mb-[0.65rem] text-xs font-extrabold tracking-[0.15em] text-primary";
const sectionTitle = "text-3xl md:text-4xl lg:text-5xl tracking-[-0.035em]";

export function TrustAndTestimonials() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="trust-title">
      <div className="mb-[1.65rem] max-w-[700px]">
        <p className={eyebrow}>СПОКОЙСТВИЕ ВЪВ ВСЯКА СТЪПКА</p>
        <h2 id="trust-title" className={sectionTitle}>
          Защо да изберете DOMORA
        </h2>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {benefits.map((benefit) => (
          <li key={benefit.title} className="min-w-0">
            <Card className="flex h-full gap-4 rounded-2xl border-[#dbe4de] p-[1.2rem]">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf2ec] text-primary">
                <LandingIcon path={benefit.icon} className="size-[1.45rem]" />
              </span>
              <div>
                <h3 className="text-base leading-[1.4]">{benefit.title}</h3>
                <p className="mt-[0.55rem] mb-0 text-[0.88rem] text-[#63736d]">
                  {benefit.description}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-12 md:mt-16 mb-[1.4rem] max-w-[690px]">
        <p className={eyebrow}>ИСТОРИИ ОТ ДОМОВЕ, ЗА КОИТО СЕ ГРИЖИМ</p>
        <h3 className="text-2xl md:text-3xl lg:text-4xl tracking-[-0.03em]">
          Доверие, изградено с добре свършена работа
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="flex min-w-0 flex-col rounded-[18px] bg-[#174c41] p-5 md:p-6 text-white"
          >
            <div
              className="text-[0.85rem] tracking-[0.14em] text-accent"
              aria-label="Оценка: 5 от 5"
            >
              <span aria-hidden="true">★★★★★</span>
            </div>
            <blockquote className="mx-0 mt-4 mb-[1.35rem] flex-1 text-base leading-[1.7] text-[#f4f8f6]">
              „{testimonial.quote}“
            </blockquote>
            <footer className="flex items-center gap-3 justify-between px-11 pt-[10px] pb-[22px] text-xs text-muted-foreground">
              <span
                className="grid size-11 place-items-center rounded-full bg-accent text-[0.8rem] font-[850] text-[#17362f]"
                aria-hidden="true"
              >
                {testimonial.initials}
              </span>
              <div className="grid">
                <strong>{testimonial.name}</strong>
                <span className="text-[0.78rem] text-[#bdd0c9]">
                  {testimonial.context}
                </span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section
      id="faq"
      className="grid scroll-mt-34 grid-cols-1 gap-8 py-12 md:py-16 md:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)] md:gap-12"
      aria-labelledby="faq-title"
    >
      <div>
        <p className={eyebrow}>ИМАТЕ ВЪПРОС?</p>
        <h2 id="faq-title" className={sectionTitle}>
          Често задавани въпроси
        </h2>
        <span className="mt-4 block max-w-[430px] text-[#61726c]">
          Събрахме най-важното, за да знаете какво да очаквате още преди първата
          заявка.
        </span>
      </div>
      <div>
        {questions.map((item) => (
          <details
            key={item.question}
            className="group border-t border-tone-cedbd3 last:border-b"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 min-h-11 py-3 text-[1.05rem] font-[750] text-[#182e29] after:grid after:size-7 after:shrink-0 after:place-items-center after:rounded-full after:bg-[#eaf2ec] after:text-primary after:content-['+'] group-open:after:content-['−'] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#84b998] [&::-webkit-details-marker]:hidden">
              {item.question}
            </summary>
            <p className="m-0 max-w-[680px] pr-12 pb-[1.4rem] text-[#61726c]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
