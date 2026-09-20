"use client";

import { ToastProvider } from "@/components/ui/toast-provider";
import { DemoProvider } from "@/features/requests/demo-provider";
import { BookingDialog } from "@/features/bookings/booking-dialog";
import { BrowserBookingTool } from "@/features/bookings/browser-tool";
import { AuthProvider } from "@/features/auth/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <DemoProvider>
          {children}
          <BookingDialog />
          <BrowserBookingTool />
        </DemoProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
