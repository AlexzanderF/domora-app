"use client";

import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

const TOAST_ID = "domora-toast";

/**
 * Shows a toast. A fixed id makes a new message replace the visible one, and
 * the inner status element keeps it announced to assistive technology.
 */
export function notify(message: string) {
  toast(<span role="status">{message}</span>, {
    id: TOAST_ID,
    duration: 4200,
  });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export function useToast() {
  return notify;
}
