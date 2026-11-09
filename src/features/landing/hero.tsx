import Link from "next/link";
import { Button } from "@/components/ui/button";

const trustBadges = [
  "100% проверени специалисти",
  "Фиксирани цени",
  "Застраховани услуги",
];

export function Hero() {
  return (
    <section
      className="relative grid min-h-[430px] grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)] items-center gap-[clamp(1.5rem,4vw,3.25rem)] overflow-hidden rounded-3xl bg-[#174c41] p-[clamp(1.75rem,4vw,3.25rem)] text-white before:absolute before:-bottom-[170px] before:-left-[110px] before:size-[360px] before:rounded-full before:border before:border-white/12 before:content-[''] max-[1050px]:min-h-0 max-[1050px]:grid-cols-1 max-[600px]:rounded-[18px] max-[600px]:px-5 max-[600px]:py-7"
      aria-labelledby="landing-hero-title"
    >
      <div className="relative z-[1] max-w-[720px]">
        <p className="mt-0 mb-[0.85rem] text-xs font-extrabold tracking-[0.16em] text-accent">
          ГРИЖА ЗА ДОМА БЕЗ ИЗЛИШНИ ГРИЖИ
        </p>
        <h1
          id="landing-hero-title"
          className="m-0 max-w-[700px] text-[clamp(2.35rem,4.5vw,4.75rem)] leading-[1.03] tracking-[-0.045em] text-balance text-white max-[600px]:text-[clamp(2.1rem,11vw,3rem)]"
        >
          Спокойствие за вашия дом — надеждни домашни услуги и абонаменти
        </h1>
        <p className="mt-4 mb-0 max-w-[610px] text-[clamp(1rem,1.4vw,1.2rem)] leading-[1.65] text-[#d9e8e3]">
          Планирайте почистване, ремонти и редовна поддръжка с ясни цени и
          проверени специалисти на едно място.
        </p>
        <div className="mt-[1.45rem] flex flex-wrap gap-3 max-[600px]:grid">
          <Button
            asChild
            className="inline-flex min-h-[50px] items-center justify-center rounded-[10px] border-2 border-transparent bg-accent px-[1.35rem] py-[0.8rem] font-[750] text-[#17362f] hover:bg-[#e5f6a3] focus-visible:outline-white"
          >
            <Link href="/signup">Регистрирай се</Link>
          </Button>
          <Button
            asChild
            className="inline-flex min-h-[50px] items-center justify-center rounded-[10px] border-2 border-solid border-white/65 bg-transparent px-[1.35rem] py-[0.8rem] font-[750] text-white hover:border-white hover:bg-white/9 focus-visible:outline-white"
          >
            <Link href="#services">Разгледай услугите</Link>
          </Button>
        </div>
        <ul
          className="mt-[1.45rem] mb-0 flex list-none flex-wrap gap-x-5 gap-y-3 p-0 text-sm text-[#eff7f4] max-[600px]:grid"
          aria-label="Предимства на DOMORA"
        >
          {trustBadges.map((badge) => (
            <li key={badge} className="flex items-center gap-[0.45rem]">
              <span
                className="inline-grid size-[1.35rem] shrink-0 place-items-center rounded-full bg-accent text-xs font-black text-[#17362f]"
                aria-hidden="true"
              >
                ✓
              </span>
              {badge}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="relative min-h-[300px] self-stretch max-[1050px]:hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[3%] right-0 size-[230px] rounded-full bg-accent" />
        <svg
          className="absolute -right-[12%] bottom-[7%] w-[min(410px,125%)] text-[#f6f2e8] drop-shadow-[0_24px_28px_rgb(7_34_28/28%)]"
          viewBox="0 0 360 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M55 143 180 42l125 101v116a17 17 0 0 1-17 17H72a17 17 0 0 1-17-17V143Z"
            fill="currentColor"
          />
          <path
            d="m31 159 149-121 149 121M104 276V150h152v126"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M137 197h86M137 229h58"
            stroke="#1B594B"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute right-0 bottom-0 grid max-w-[220px] gap-[0.2rem] rounded-xl border border-white/35 bg-[rgb(16_57_48/88%)] px-[1.15rem] py-4 shadow-[0_16px_35px_rgb(7_34_28/20%)] backdrop-blur-[8px]">
          <span className="text-[0.68rem] font-extrabold tracking-[0.16em] text-accent">
            DOMORA
          </span>
          <strong className="text-[0.9rem] leading-[1.35]">
            Домът ви е в добри ръце.
          </strong>
        </div>
      </div>
    </section>
  );
}
