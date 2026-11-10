import type { Metadata } from "next";
import { PlansConfigurator } from "@/features/plans/plans-configurator";
import { findTariffs } from "@/domain/pricing/tariffs";

export const metadata: Metadata = {
  title: "Абонаменти",
  description:
    "Едно посещение от майстор месечно за дома или редовно почистване на общите части.",
};

export default async function PlansPage() {
  const tariffs = await findTariffs();
  return (
    <main
      id="main"
      className="mx-auto min-h-[calc(100vh-76px)] w-[min(1180px,calc(100%-3rem))] max-w-none px-0 pt-[clamp(2.5rem,6vw,5rem)] pb-[clamp(4rem,8vw,7rem)] max-[520px]:w-[calc(100%-2rem)] max-[520px]:pt-8"
    >
      <header className="static block h-auto w-[min(760px,100%)] border-0 bg-transparent p-0 text-[14px] text-[#17372f]">
        <span className="text-[0.72rem] font-[850] tracking-[0.12em] text-[#517067]">
          АБОНАМЕНТНА ГРИЖА
        </span>
        <h1 className="mt-[0.55rem] mb-[0.8rem] text-[clamp(2.25rem,5vw,4rem)] tracking-normal text-[#153c33] max-[520px]:text-[2.35rem]">
          Грижа за дома. Спокойствие за вас.
        </h1>
        <p className="m-0 max-w-[650px] text-[1.05rem] text-[#5b6f68]">
          Майстор за дома или поддържан вход — изберете абонамента, който
          отговаря на вашите нужди.
        </p>
      </header>
      <PlansConfigurator tariffs={tariffs} />
    </main>
  );
}
