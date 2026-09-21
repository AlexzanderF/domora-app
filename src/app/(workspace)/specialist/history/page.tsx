import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "История и приходи" };

export default function SpecialistHistoryPage() {
  return (
    <>
      <PageHeading
        eyebrow="ОТЧЕТ И ПРИХОДИ"
        title="История на завършените услуги"
        description="Преглед на приключената работа, клиентски отзиви и натрупани приходи."
      />
      <div className="card">
        <p>Историята на приключените заявки ще се визуализира тук.</p>
      </div>
    </>
  );
}
