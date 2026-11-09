"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { initialRequests, initialTariffs } from "./demo-data";
import { transitionRequest } from "./transitions";
import type { RequestAction, Role, ServiceRequest, Tariffs } from "./types";

interface DemoContextValue {
  requests: ServiceRequest[];
  tariffs: Tariffs;
  updateRequest: (id: number, action: RequestAction, role: Role) => void;
  updateTariffs: (tariffs: Tariffs) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// Session-only demo data; replace this boundary with a server-backed repository later.
export function DemoProvider({
  children,
  tariffs: serverTariffs = initialTariffs,
}: {
  children: React.ReactNode;
  tariffs?: Tariffs;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [tariffsOverride, updateTariffs] = useState<Tariffs | null>(null);
  const tariffs = tariffsOverride ?? serverTariffs;

  const updateRequest = useCallback(
    (id: number, action: RequestAction, role: Role) => {
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? transitionRequest(request, action, role)
            : request,
        ),
      );
    },
    [],
  );

  return (
    <DemoContext.Provider
      value={{
        requests,
        tariffs,
        updateRequest,
        updateTariffs,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo requires DemoProvider");
  return context;
}
