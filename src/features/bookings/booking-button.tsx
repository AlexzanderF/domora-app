"use client";

import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/bookings/booking-provider";

export function BookingButton() {
  const { openBooking } = useBooking();
  return (
    <Button
      className="w-full md:w-auto"
      onClick={() => openBooking({ category: 0 })}
    >
      + Нова заявка
    </Button>
  );
}
