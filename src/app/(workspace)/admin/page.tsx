import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RequestList } from "@/features/requests/request-list";
import { WorkspaceStats } from "@/features/workspace/workspace-stats";
import { TariffForm } from "@/features/workspace/tariff-form";

export const metadata: Metadata = { title: "Администратор" };

export default function AdminPage() {
  return (
    <>
      <PageHeading
        eyebrow="ДЕМО РАБОТНО ПРОСТРАНСТВО"
        title="Общ поглед върху DOMORA"
        description="Управлявайте заявките и демонстрационните тарифи."
      />
      <WorkspaceStats />
      <div className="card">
        <RequestList actions role="admin" />
      </div>
      <TariffForm />
    </>
  );
}
