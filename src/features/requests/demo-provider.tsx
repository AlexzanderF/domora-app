"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { initialRequests, initialTariffs } from "./demo-data";
import { transitionRequest } from "./transitions";
import type {
  BookingSelection,
  RequestAction,
  Role,
  ServiceRequest,
  Tariffs,
} from "./types";

interface DemoContextValue {
  requests: ServiceRequest[];
  tariffs: Tariffs;
  booking: BookingSelection | null;
  openBooking: (selection: BookingSelection) => void;
  closeBooking: () => void;
  addRequest: (request: ServiceRequest) => void;
  updateRequest: (id: string, action: RequestAction, role: Role) => void;
  updateTariffs: (tariffs: Tariffs) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// Session-only demo data; replace this boundary with a server-backed repository later.
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState(initialRequests);
  const [tariffs, updateTariffs] = useState(initialTariffs);
  const [booking, setBooking] = useState<BookingSelection | null>(null);
  const openBooking = useCallback(
    (selection: BookingSelection) => setBooking(selection),
    [],
  );
  const closeBooking = useCallback(() => setBooking(null), []);
  const addRequest = useCallback(
    (request: ServiceRequest) =>
      setRequests((current) => [request, ...current]),
    [],
  );
  const updateRequest = useCallback(
    (id: string, action: RequestAction, role: Role) => {
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
        booking,
        openBooking,
        closeBooking,
        addRequest,
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
