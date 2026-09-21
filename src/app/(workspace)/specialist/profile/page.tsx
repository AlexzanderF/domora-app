import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Профил на специалист" };

export default function SpecialistProfilePage() {
  return (
    <>
      <PageHeading
        eyebrow="ПРОФЕСИОНАЛЕН ПРОФИЛ"
        title="Специализация и район"
        description="Управлявайте категорията на услугите, работния си район и професионалните данни."
      />
      <div className="card">
        <p>Управление на данните и профила на специалиста.</p>
      </div>
    </>
  );
}
