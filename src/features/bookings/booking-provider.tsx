"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { BookingSelection } from "@/domain/requests/types";

interface BookingContextValue {
  booking: BookingSelection | null;
  openBooking: (selection: BookingSelection) => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// UI-only: remembers which booking dialog is open. No request data lives here.
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState<BookingSelection | null>(null);
  const openBooking = useCallback(
    (selection: BookingSelection) => setBooking(selection),
    [],
  );
  const closeBooking = useCallback(() => setBooking(null), []);
  const value = useMemo(
    () => ({ booking, openBooking, closeBooking }),
    [booking, openBooking, closeBooking],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking requires BookingProvider");
  return context;
}
