"use client";

import { useDemo } from "@/features/requests/demo-provider";

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
      (request) => !request.cancelled && request.status !== "COMPLETED",
    ).length;
  const completed =
    initialStats?.completed ??
    requests.filter((request) => request.status === "COMPLETED").length;

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
