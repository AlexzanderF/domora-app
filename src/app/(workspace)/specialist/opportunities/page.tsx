import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Нови възможности" };

export default function SpecialistOpportunitiesPage() {
  return (
    <>
      <PageHeading
        eyebrow="ВЪЗМОЖНОСТИ ЗА РАБОТА"
        title="Нови заявки във вашия район"
        description="Преглеждайте и приемайте налични заявки, съответстващи на вашия профил."
      />
      <div className="card">
        <p>Няма нови възможности в момента.</p>
      </div>
    </>
  );
}
