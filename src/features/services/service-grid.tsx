"use client";

import { useBooking } from "@/features/bookings/booking-provider";
import { categories } from "./catalog";
import { ServiceIcon } from "./service-icon";

export function ServiceGrid() {
  const { openBooking } = useBooking();
  return (
    <div className="grid grid-cols-6 gap-3 max-[1100px]:grid-cols-3 max-[700px]:gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          className="rounded-xl border border-border bg-white px-2 pt-[22px] pb-[18px] text-[14px] font-semibold text-foreground transition-[transform,border-color] duration-150 ease-[ease] hover:-translate-y-[3px] hover:border-primary max-[700px]:px-[5px] max-[700px]:py-[18px] [&_svg]:mx-auto [&_svg]:mb-[14px] [&_svg]:block [&_svg]:size-[29px] [&_svg]:stroke-primary"
          onClick={() => openBooking({ category: category.id })}
        >
          <ServiceIcon category={category.id} />
          {category.name}
        </button>
      ))}
    </div>
  );
}
