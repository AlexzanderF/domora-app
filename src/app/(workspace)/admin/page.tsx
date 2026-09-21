import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RequestList } from "@/features/requests/request-list";
import { WorkspaceStats } from "@/features/workspace/workspace-stats";
import { TariffForm } from "@/features/workspace/tariff-form";
import {
  findAllRequestsForAdmin,
  findDatabaseTariffs,
  findOperationalMetrics,
} from "@/features/admin/server/metrics";

export const metadata: Metadata = { title: "Администратор" };

export default async function AdminPage() {
  const [initialStats, initialRequests, initialTariffs] = await Promise.all([
    findOperationalMetrics(),
    findAllRequestsForAdmin(),
    findDatabaseTariffs(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="АДМИНИСТРАТИВЕН ПАНЕЛ"
        title="Общ поглед върху DOMORA"
        description="Управлявайте заявките, оперативните метрики и актуалните тарифи."
      />
      <WorkspaceStats initialStats={initialStats} />
      <div className="card">
        <RequestList actions role="admin" initialRequests={initialRequests} />
      </div>
      <TariffForm initialTariffs={initialTariffs} />
    </>
  );
}
