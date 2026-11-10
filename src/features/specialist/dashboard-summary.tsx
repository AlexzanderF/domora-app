"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { isActiveStage } from "@/features/requests/request-rules";
import { localDate, money } from "@/lib/format";
import { RequestStatus } from "@/domain/requests/types";
import type { ServiceRequest } from "@/domain/requests/types";

function computeStats(requests: ServiceRequest[]) {
  const today = localDate();
  const activeJobs = requests.filter(
    (request) => !request.cancelled && isActiveStage(request.status),
  ).length;
  const todaysEarnings = requests
    .filter(
      (request) =>
        !request.cancelled &&
        request.status === RequestStatus.Completed &&
        request.date === today,
    )
    .reduce((sum, request) => sum + (request.price || 0), 0);
  return { activeJobs, todaysEarnings };
}

export function DashboardSummary({
  initialRequests,
}: {
  initialRequests: ServiceRequest[];
}) {
  const { activeJobs, todaysEarnings } = computeStats(initialRequests);

  return (
    <div className="mb-7 flex flex-wrap items-stretch gap-4">
      <Card className="flex min-w-[180px] flex-1 flex-col gap-1.5">
        <span className="text-[13px] text-muted-foreground">
          Активни задачи
        </span>
        <strong className="text-[28px]">{activeJobs}</strong>
      </Card>
      <Card className="flex min-w-[180px] flex-1 flex-col gap-1.5">
        <span className="text-[13px] text-muted-foreground">
          Приходи за днес
        </span>
        <strong className="text-[28px]">{money(todaysEarnings)}</strong>
      </Card>
      <Link
        href="/specialist/history"
        className="flex items-center text-sm font-semibold whitespace-nowrap text-primary no-underline hover:underline"
      >
        История &amp; приходи →
      </Link>
    </div>
  );
}
