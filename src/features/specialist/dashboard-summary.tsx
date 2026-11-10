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
    <div className="mb-7 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-stretch md:gap-4">
      <Card className="flex min-w-0 flex-col gap-1.5 md:min-w-[180px] md:flex-1">
        <span className="text-[13px] text-muted-foreground">
          Активни задачи
        </span>
        <strong className="text-[28px]">{activeJobs}</strong>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1.5 md:min-w-[180px] md:flex-1">
        <span className="text-[13px] text-muted-foreground">
          Приходи за днес
        </span>
        <strong className="text-[28px]">{money(todaysEarnings)}</strong>
      </Card>
      <Link
        href="/specialist/history"
        className="col-span-2 flex min-h-11 items-center justify-center text-sm font-semibold whitespace-nowrap text-primary no-underline hover:underline md:justify-start"
      >
        История &amp; приходи →
      </Link>
    </div>
  );
}
