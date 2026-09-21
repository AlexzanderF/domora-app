"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
  initialRequests,
  initialSubscription,
  initialTariffs,
} from "./demo-data";
import { transitionRequest } from "./transitions";
import type {
  BookingSelection,
  RequestAction,
  Role,
  ServiceRequest,
  Tariffs,
} from "./types";
import type {
  Subscription,
  SubscriptionPlan,
} from "@/features/subscriptions/types";

interface DemoContextValue {
  requests: ServiceRequest[];
  tariffs: Tariffs;
  booking: BookingSelection | null;
  subscription: Subscription | null;
  openBooking: (selection: BookingSelection) => void;
  closeBooking: () => void;
  addRequest: (request: ServiceRequest) => void;
  updateRequest: (id: string, action: RequestAction, role: Role) => void;
  updateTariffs: (tariffs: Tariffs) => void;
  setSubscription: (subscription: Subscription | null) => void;
  subscribePlan: (
    planType: SubscriptionPlan,
    propertyAddress?: string,
    propertyArea?: number,
  ) => void;
  cancelSubscription: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// Session-only demo data; replace this boundary with a server-backed repository later.
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState(initialRequests);
  const [tariffs, updateTariffs] = useState(initialTariffs);
  const [booking, setBooking] = useState<BookingSelection | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(
    initialSubscription,
  );

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

  const subscribePlan = useCallback(
    (
      planType: SubscriptionPlan,
      propertyAddress: string = "София · ул. Примерна 12, ет. 3, ап. 8",
      propertyArea: number = planType === "HOME" ? 85 : 6,
    ) => {
      const newSub: Subscription = {
        id: crypto.randomUUID(),
        userId: "client-demo-1",
        planType,
        propertyAddress,
        propertyArea,
        status: "ACTIVE",
        visitsRemaining: planType === "HOME" ? 2 : 4,
        validUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSubscription(newSub);
    },
    [],
  );

  const cancelSubscription = useCallback(() => {
    setSubscription((curr) =>
      curr
        ? {
            ...curr,
            status: "CANCELLED",
            updatedAt: new Date().toISOString(),
          }
        : null,
    );
  }, []);

  return (
    <DemoContext.Provider
      value={{
        requests,
        tariffs,
        booking,
        subscription,
        openBooking,
        closeBooking,
        addRequest,
        updateRequest,
        updateTariffs,
        setSubscription,
        subscribePlan,
        cancelSubscription,
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
