"use client";

import { useBooking } from "@/features/bookings/booking-provider";
import type { CategoryId } from "@/domain/requests/types";

export function BookingCta({
  category,
  className,
  children,
}: {
  category: CategoryId;
  className?: string;
  children: React.ReactNode;
}) {
  const { openBooking } = useBooking();

  return (
    <button
      type="button"
      className={className}
      onClick={() => openBooking({ category })}
    >
      {children}
    </button>
  );
}
