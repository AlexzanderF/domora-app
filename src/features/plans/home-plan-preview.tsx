"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const services = [
  "ВиК",
  "Електро",
  "Климатици",
  "Ключарски услуги",
  "Дребни ремонти",
];

const section = "border-b border-[#dce5df] pb-10";
const step = "text-xs font-[850] tracking-[0.12em] text-[#517067]";
const sectionTitle = "mt-[0.35rem] mb-[1.2rem] text-[1.35rem] text-[#17372f]";
const hint = "mt-3 mb-0 text-[0.9rem] text-tone-687b75";

export function HomePlanPreview({
  onChooseEntry,
}: {
  onChooseEntry: () => void;
}) {
  const [extraVisit, setExtraVisit] = useState(false);

  return (
    <div className="mt-[clamp(2.5rem,6vw,4.5rem)] grid grid-cols-1 items-start gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(330px,420px)]">
      <section className="grid gap-10" aria-labelledby="configure-title">
        <div className={section}>
          <span className={step}>01 / ИЗБЕРЕТЕ ПЛАН</span>
          <h2 id="configure-title" className={sectionTitle}>
            За кое пространство?
          </h2>
          <div
            className="grid grid-cols-2 gap-2 rounded-lg border border-[#ccd9d1] bg-[#e9efeb] p-[0.35rem]"
            aria-label="Изберете план"
          >
            <Button
              type="button"
              variant="ghost"
              className="min-h-12 rounded-md p-0 font-[750] text-[#4c625b] hover:bg-transparent aria-pressed:bg-white aria-pressed:text-[#175246] aria-pressed:shadow-[0_1px_5px_rgb(20_56_46/12%)] aria-pressed:hover:bg-white"
              aria-pressed="true"
            >
              За дома
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-12 rounded-md p-0 font-[750] text-[#4c625b] hover:bg-transparent aria-pressed:bg-white aria-pressed:text-[#175246] aria-pressed:shadow-[0_1px_5px_rgb(20_56_46/12%)] aria-pressed:hover:bg-white"
              aria-pressed="false"
              onClick={onChooseEntry}
            >
              За входа
            </Button>
          </div>
          <p className={hint}>
            Един абонамент за малките задачи и проблеми у дома.
          </p>
        </div>

        <div className={section}>
          <span className={step}>02 / ВКЛЮЧЕНО В АБОНАМЕНТА</span>
          <h2 className={sectionTitle}>Вашият майстор. Всеки месец.</h2>
          <div className="flex items-center gap-[1.2rem] rounded-xl border border-[#cbdccf] bg-[#edf4ef] p-6 text-[#175246]">
            <strong className="text-[3.5rem] leading-none">1</strong>
            <div>
              <h3 className="mb-[0.4rem] text-[1.1rem]">
                посещение от майстор месечно
              </h3>
              <p className="m-0 text-[0.9rem] text-[#50645e]">
                Споделете от какво имате нужда и планирайте посещението.
              </p>
            </div>
          </div>
          <h3 className="mt-6 mb-[0.8rem] text-base text-[#17372f]">
            За какво можете да разчитате на нас
          </h3>
          <ul className="m-0 flex list-none flex-wrap gap-[0.6rem] p-0">
            {services.map((service) => (
              <li
                key={service}
                className="rounded-lg border border-[#dce5df] bg-white px-[0.85rem] py-[0.6rem] text-[#29453e]"
              >
                <span aria-hidden="true" className="mr-2 text-[#287057]">
                  ✓
                </span>
                {service}
              </li>
            ))}
          </ul>
        </div>

        <div className={section}>
          <span className={step}>03 / ПРИ НУЖДА ОТ ОЩЕ ПОМОЩ</span>
          <h2 className={sectionTitle}>Още едно посещение? Няма проблем.</h2>
          <p className={hint}>
            Всяко допълнително посещение се заплаща отделно от месечния
            абонамент.
          </p>
          <label className="mt-4 flex cursor-pointer items-center gap-[0.85rem] rounded-lg border border-[#ccd9d1] p-4">
            <input
              type="checkbox"
              className="m-0 size-5 shrink-0 accent-[#175246]"
              checked={extraVisit}
              onChange={(event) => setExtraVisit(event.target.checked)}
            />
            <span className="grid gap-[0.2rem] text-[#29453e]">
              <strong>Добави още едно посещение</strong>
              <small className="font-normal text-tone-687b75">
                С доплащане към абонамента
              </small>
            </span>
          </label>
        </div>
      </section>

      <aside
        className="lg:sticky lg:top-[100px]"
        aria-labelledby="summary-title"
      >
        <Card className="rounded-lg border-[#cad8d0] p-[clamp(1.4rem,3vw,2rem)] shadow-[0_16px_45px_rgb(22_60_50/9%)]">
          <div className="flex items-center justify-between">
            <span className={step}>ВАШИЯТ ПЛАН</span>
            <strong className="text-[0.75rem] text-[#274c3d]">
              Майстор за дома
            </strong>
          </div>
          <h2
            id="summary-title"
            className="mt-[0.45rem] mb-0 text-[1.65rem] text-[#153c33]"
          >
            За дома
          </h2>
          <p className="mt-[0.3rem] mb-0 text-[0.88rem] text-tone-687b75">
            Практична помощ за вашия апартамент или къща.
          </p>
          <div
            className="my-[1.4rem] grid gap-[0.3rem] rounded-lg bg-[#edf4ef] p-[1.2rem] text-[#175246]"
            aria-live="polite"
          >
            <strong className="text-[1.65rem]">
              {extraVisit ? "2 посещения" : "1 посещение"}
            </strong>
            <span className="text-[0.9rem]">
              {extraVisit
                ? "1 включено + 1 с доплащане"
                : "включено всеки месец"}
            </span>
          </div>
          <dl className="mb-6">
            {["Месечен абонамент", "Допълнително посещение"].map((label) => (
              <div
                key={label}
                className="grid gap-[0.3rem] border-b border-[#e1e8e3] py-[0.9rem]"
              >
                <dt className="text-[0.9rem] text-[#40564f]">{label}</dt>
                <dd className="m-0 font-bold text-[#17372f]">
                  Предстои обявяване
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-[0.7rem] mb-6 text-[0.76rem] text-tone-687b75">
            ВиК · Електро · Климатици · Ключарски услуги · Дребни ремонти
          </p>
          <Button
            type="button"
            className="min-h-12 w-full cursor-not-allowed rounded-[7px] bg-[#175246] px-0 py-0 font-extrabold opacity-60 hover:bg-[#103c33]"
            disabled
          >
            Абонирането предстои
          </Button>
          <small className="mt-4 block text-center text-xs text-[#74847f]">
            Цените и подробните условия ще бъдат обявени преди старта на
            абонамента.
          </small>
        </Card>
      </aside>
    </div>
  );
}
