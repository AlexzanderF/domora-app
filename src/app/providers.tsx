"use client";

import type { User } from "@/domain/identity/types";
import type { Tariffs } from "@/domain/requests/types";
import { ToastProvider } from "@/components/ui/toast-provider";
import { BookingProvider } from "@/features/bookings/booking-provider";
import { BookingDialog } from "@/features/bookings/booking-dialog";
import { BrowserBookingTool } from "@/features/bookings/browser-tool";
import { AuthProvider } from "@/features/auth/auth-provider";

export function Providers({
  children,
  initialUser,
  tariffs,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  tariffs: Tariffs;
}) {
  return (
    <ToastProvider>
      <AuthProvider initialUser={initialUser}>
        <BookingProvider>
          {children}
          <BookingDialog tariffs={tariffs} />
          <BrowserBookingTool />
        </BookingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
