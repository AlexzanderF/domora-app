import { RequestPriority } from "./types";

export function isUrgentPriority(priority?: RequestPriority | null): boolean {
  return (
    priority === RequestPriority.Urgent ||
    priority === RequestPriority.Emergency
  );
}
