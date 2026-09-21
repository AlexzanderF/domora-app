"use client";

import type { User } from "@/features/auth/types";
import { ToastProvider } from "@/components/ui/toast-provider";
import { DemoProvider } from "@/features/requests/demo-provider";
import { BookingDialog } from "@/features/bookings/booking-dialog";
import { BrowserBookingTool } from "@/features/bookings/browser-tool";
import { AuthProvider } from "@/features/auth/auth-provider";

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  return (
    <ToastProvider>
      <AuthProvider initialUser={initialUser}>
        <DemoProvider>
          {children}
          <BookingDialog />
          <BrowserBookingTool />
        </DemoProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
