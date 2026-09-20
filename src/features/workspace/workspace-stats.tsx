"use client";

import { useDemo } from "@/features/requests/demo-provider";

export function WorkspaceStats() {
  const { requests } = useDemo();
  return (
    <div className="stats">
      <div className="card">
        Общо заявки<strong>{requests.length}</strong>
      </div>
      <div className="card">
        Активни
        <strong>
          {
            requests.filter(
              (request) => !request.cancelled && request.status < 5,
            ).length
          }
        </strong>
      </div>
      <div className="card">
        Приключени
        <strong>
          {requests.filter((request) => request.status === 5).length}
        </strong>
      </div>
    </div>
  );
}
