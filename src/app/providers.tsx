"use client";

import { ToastProvider } from "@/components/ui/toast-provider";
import { DemoProvider } from "@/features/requests/demo-provider";
import { BookingDialog } from "@/features/bookings/booking-dialog";
import { BrowserBookingTool } from "@/features/bookings/browser-tool";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DemoProvider>
        {children}
        <BookingDialog />
        <BrowserBookingTool />
      </DemoProvider>
    </ToastProvider>
  );
}
