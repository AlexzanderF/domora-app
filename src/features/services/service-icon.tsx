import { categories } from "./catalog";
import type { CategoryId } from "@/features/requests/types";

export function ServiceIcon({ category }: { category: CategoryId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={categories[category].iconPath} />
    </svg>
  );
}
