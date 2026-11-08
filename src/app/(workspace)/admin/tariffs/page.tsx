import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { TariffForm } from "@/features/workspace/tariff-form";
import { findTariffs } from "@/domain/pricing/tariffs";

export const metadata: Metadata = { title: "Тарифи и ценообразуване" };
export const dynamic = "force-dynamic";

export default async function AdminTariffsPage() {
  const initialTariffs = await findTariffs();

  return (
    <>
      <PageHeading
        eyebrow="ЦЕНООБРАЗУВАНЕ"
        title="Тарифи за услуги"
        description="Управлявайте стандартните, спешните и празничните ставки за всяка категория."
      />
      <TariffForm initialTariffs={initialTariffs} />
    </>
  );
}
