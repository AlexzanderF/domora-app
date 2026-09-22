"use client";

import { useDemo } from "@/features/requests/demo-provider";
import { RequestStatus } from "@/features/requests/types";

export interface WorkspaceStatsProps {
  initialStats?: {
    total: number;
    active: number;
    completed: number;
  } | null;
}

export function WorkspaceStats({ initialStats }: WorkspaceStatsProps = {}) {
  const { requests } = useDemo();

  const total = initialStats?.total ?? requests.length;
  const active =
    initialStats?.active ??
    requests.filter(
      (request) =>
        !request.cancelled && request.status !== RequestStatus.Completed,
    ).length;
  const completed =
    initialStats?.completed ??
    requests.filter((request) => request.status === RequestStatus.Completed)
      .length;

  return (
    <div className="stats">
      <div className="card">
        Общо заявки<strong>{total}</strong>
      </div>
      <div className="card">
        Активни<strong>{active}</strong>
      </div>
      <div className="card">
        Приключени<strong>{completed}</strong>
      </div>
    </div>
  );
}
