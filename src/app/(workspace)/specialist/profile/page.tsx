import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Профил на специалист" };

export default function SpecialistProfilePage() {
  return (
    <>
      <PageHeading
        eyebrow="ПРОФЕСИОНАЛЕН ПРОФИЛ"
        title="Специализация и район"
        description="Управлявайте категорията на услугите, работния си район и професионалните данни."
      />
      <Card>
        <p>Управление на данните и профила на специалиста.</p>
      </Card>
    </>
  );
}
