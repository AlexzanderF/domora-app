import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Моят абонамент" };

export default function ClientPlanPage() {
  return (
    <>
      <PageHeading
        eyebrow="АБОНАМЕНТЕН ПЛАН"
        title="Грижа за дома с абонамент"
        description="Управлявайте своя месечен абонамент за профилактика и поддръжка."
      />
      <div className="card">
        <p>Информацията за вашия абонамент се зарежда.</p>
      </div>
    </>
  );
}
