import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "История и приходи" };

export default function SpecialistHistoryPage() {
  return (
    <>
      <PageHeading
        eyebrow="ОТЧЕТ И ПРИХОДИ"
        title="История на завършените услуги"
        description="Преглед на приключената работа, клиентски отзиви и натрупани приходи."
      />
      <Card>
        <p>Историята на приключените заявки ще се визуализира тук.</p>
      </Card>
    </>
  );
}
