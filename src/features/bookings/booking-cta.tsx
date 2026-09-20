"use client";

import { useDemo } from "@/features/requests/demo-provider";
import type { CategoryId } from "@/features/requests/types";

export function BookingCta({
  category,
  className,
  children,
}: {
  category: CategoryId;
  className?: string;
  children: React.ReactNode;
}) {
  const { openBooking } = useDemo();

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
