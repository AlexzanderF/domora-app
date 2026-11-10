import { Card } from "@/components/ui/card";
import { LandingIcon } from "./landing-icon";

const steps = [
  {
    title: "Избор на услуга или абонамент",
    description:
      "Изберете почистване, домашен ремонт или абонаментна грижа според нуждите на дома ви.",
    icon: "M4 6h16M4 12h10M4 18h7M18 14v6m-3-3h6",
  },
  {
    title: "Проверен специалист на адрес",
    description:
      "DOMORA намира надежден изпълнител, за да не губите време в групи и обяви.",
    icon: "M12 3 5 6v5c0 4.4 3 7.7 7 10 4-2.3 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-4",
  },
  {
    title: "Лесно плащане и спокойствие",
    description:
      "Следете заявката, плащайте сигурно и оставете редовната грижа на нас.",
    icon: "M3 7h18v12H3V7Zm0 4h18M7 15h3",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-34 py-10 md:py-[clamp(2.5rem,5vw,4.25rem)]"
      aria-labelledby="how-it-works-title"
    >
      <div className="mb-[1.65rem] max-w-[680px]">
        <p className="mt-0 mb-[0.65rem] text-xs font-extrabold tracking-[0.15em] text-primary">
          ТРИ ЛЕСНИ СТЪПКИ
        </p>
        <h2
          id="how-it-works-title"
          className="text-[clamp(2rem,4vw,3.25rem)] tracking-[-0.035em]"
        >
          Как работи DOMORA
        </h2>
        <p className="mt-4 mb-0 text-[1.05rem] text-[#5f7069]">
          От първия избор до свършената работа — всичко е ясно, проследимо и
          подредено.
        </p>
      </div>

      <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="min-w-0">
            <Card className="h-full rounded-[18px] border-[#dbe4de] p-[clamp(1.15rem,2.4vw,1.6rem)]">
              <div className="mb-7 flex items-start justify-between md:mb-[1.55rem]">
                <span
                  className="grid size-[3.25rem] place-items-center rounded-[14px] bg-[#eaf2ec] text-primary"
                  aria-hidden="true"
                >
                  <LandingIcon path={step.icon} className="size-[1.7rem]" />
                </span>
                <span
                  className="text-xs font-extrabold tracking-[0.12em] text-[#a5b2ac]"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-[1.15rem] leading-[1.35] text-[#182e29]">
                {step.title}
              </h3>
              <p className="mt-3 mb-0 text-[0.94rem] leading-[1.65] text-[#63736d]">
                {step.description}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
