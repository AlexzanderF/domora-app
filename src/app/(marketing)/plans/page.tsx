import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
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
    <PageContainer
      as="main"
      id="main"
      size="plans"
      className="min-h-[calc(100dvh-76px)] pt-8 pb-[clamp(4rem,8vw,7rem)] sm:pt-[clamp(2.5rem,6vw,5rem)]"
    >
      <header className="static block h-auto w-[min(760px,100%)] border-0 bg-transparent p-0 text-[14px] text-[#17372f]">
        <span className="text-xs font-[850] tracking-[0.12em] text-[#517067]">
          АБОНАМЕНТНА ГРИЖА
        </span>
        <h1 className="mt-[0.55rem] mb-[0.8rem] text-4xl tracking-normal text-[#153c33] md:text-5xl lg:text-6xl">
          Грижа за дома. Спокойствие за вас.
        </h1>
        <p className="m-0 max-w-[650px] text-[1.05rem] text-[#5b6f68]">
          Майстор за дома или поддържан вход — изберете абонамента, който
          отговаря на вашите нужди.
        </p>
      </header>
      <PlansConfigurator tariffs={tariffs} />
    </PageContainer>
  );
}
