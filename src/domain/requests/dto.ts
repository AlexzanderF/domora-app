import type { RequestSelect } from "@/db";
import type { RequestPriority, RequestStatus } from "@/domain/requests/types";

// Serializable view of a request: timestamps are ISO strings, no Drizzle rows.
export interface RequestDto {
  id: number;
  clientId: number;
  specialistId: number | null;
  title: string;
  description: string;
  category: string;
  address: string;
  priority: RequestPriority;
  status: RequestStatus;
  price: number;
  clientPhone: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  cancelled: boolean;
  report: string | null;
  rating: number | null;
  issue: boolean;
  issueNote: string | null;
  recommendedSpecialistId: number | null;
  dispatchedByAdmin: boolean;
  subscriptionId: number | null;
  reportSubmittedAt: string | null;
  completedAt: string | null;
  ratedAt: string | null;
  issueOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

export function toDto(row: RequestSelect): RequestDto {
  return {
    id: row.id,
    clientId: row.clientId,
    specialistId: row.specialistId,
    title: row.title,
    description: row.description,
    category: row.category,
    address: row.address,
    priority: row.priority,
    status: row.status,
    price: row.price,
    clientPhone: row.clientPhone,
    scheduledDate: row.scheduledDate,
    scheduledTime: row.scheduledTime,
    cancelled: row.cancelled,
    report: row.report,
    rating: row.rating,
    issue: row.issue,
    issueNote: row.issueNote,
    recommendedSpecialistId: row.recommendedSpecialistId,
    dispatchedByAdmin: row.dispatchedByAdmin,
    subscriptionId: row.subscriptionId,
    reportSubmittedAt: iso(row.reportSubmittedAt),
    completedAt: iso(row.completedAt),
    ratedAt: iso(row.ratedAt),
    issueOpenedAt: iso(row.issueOpenedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
