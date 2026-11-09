"use client";

import { useBooking } from "@/features/bookings/booking-provider";

export function BookingButton() {
  const { openBooking } = useBooking();
  return (
    <button className="primary" onClick={() => openBooking({ category: 0 })}>
      + Нова заявка
    </button>
  );
}
