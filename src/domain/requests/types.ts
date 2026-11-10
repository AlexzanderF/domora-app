import type { ActionKind } from "./actions";

export const Role = {
  Client: "client",
  Specialist: "specialist",
  Admin: "admin",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Plan = {
  Home: "home",
  Entry: "entry",
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];

export type CategoryId = 0 | 1 | 2 | 3 | 4 | 5;

export const RequestStatus = {
  Created: "CREATED",
  Accepted: "ACCEPTED",
  InProgress: "IN_PROGRESS",
  AwaitingConfirmation: "AWAITING_CONFIRMATION",
  Completed: "COMPLETED",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const RequestPriority = {
  Standard: "STANDARD",
  Urgent: "URGENT",
  Holiday: "HOLIDAY",
  Emergency: "EMERGENCY",
} as const;
export type RequestPriority =
  (typeof RequestPriority)[keyof typeof RequestPriority];

export interface ServiceRequest {
  id: number;
  category: CategoryId;
  service: string;
  address: string;
  date: string;
  time: string;
  price: number;
  status: RequestStatus;
  priority?: RequestPriority;
  description: string;
  plan?: Plan;
  visitsPerMonth?: number;
  propertySize?: number;
  specialist?: string;
  specialistPhone?: string;
  recommendedSpecialistId?: number;
  report?: string;
  // Photos the specialist attached to the report, served by /api/photos/[id].
  reportPhotoIds?: number[];
  cancelled?: boolean;
  issue?: boolean;
  issueNote?: string;
  rating?: number;
  dispatchedByAdmin?: boolean;
  subscriptionId?: number;
  clientName?: string;
  clientPhone?: string;
  // What the viewing actor may do with this request right now.
  actions: ActionKind[];
}

export interface Tariff {
  id: number;
  category: string;
  standardRate: number;
  urgentRate: number;
  holidayRate: number;
  emergencyRate: number;
  updatedAt?: string;
}

export interface Tariffs {
  categories: Record<CategoryId, number>;
  home: number;
  entry: number;
  // Pricing settings: the flat fee for a diagnostic visit and the discount
  // given from a minimum number of monthly visits.
  diagnosticFee: number;
  volumeDiscountMinVisits: number;
  volumeDiscountPercent: number;
}

export interface BookingSelection {
  category: CategoryId;
  plan?: Plan;
}
