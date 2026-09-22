import type { RequestPriority } from "./types";

export function isUrgentPriority(priority?: RequestPriority | null): boolean {
  return priority === "URGENT" || priority === "EMERGENCY";
}
