import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RequestList } from "@/features/requests/request-list";
import { WorkspaceStats } from "@/features/workspace/workspace-stats";

export const metadata: Metadata = { title: "Специалист" };

export default function SpecialistPage() {
  return (
    <>
      <PageHeading
        eyebrow="ДЕМО РАБОТНО ПРОСТРАНСТВО"
        title="Задачите ви, подредени."
        description="Приемайте задачи и отчитайте извършената работа."
      />
      <WorkspaceStats />
      <div className="card">
        <RequestList actions role="master" />
      </div>
    </>
  );
}
