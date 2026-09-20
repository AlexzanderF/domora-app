"use client";

import { useDemo } from "@/features/requests/demo-provider";
import { categories } from "./catalog";
import { ServiceIcon } from "./service-icon";

export function ServiceGrid() {
  const { openBooking } = useDemo();
  return (
    <div className="services">
      {categories.map((category) => (
        <button
          key={category.id}
          className="service"
          onClick={() => openBooking({ category: category.id })}
        >
          <ServiceIcon category={category.id} />
          {category.name}
        </button>
      ))}
    </div>
  );
}
