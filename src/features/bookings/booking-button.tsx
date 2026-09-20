"use client";

import { useDemo } from "@/features/requests/demo-provider";

export function BookingButton() {
  const { openBooking } = useDemo();
  return (
    <button className="primary" onClick={() => openBooking({ category: 0 })}>
      + Нова заявка
    </button>
  );
}
