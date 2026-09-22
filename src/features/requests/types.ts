export type Role = "client" | "specialist" | "admin";
export type Plan = "home" | "entry";
export type CategoryId = 0 | 1 | 2 | 3 | 4 | 5;
export type RequestStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type RequestPriority = "STANDARD" | "URGENT" | "HOLIDAY" | "EMERGENCY";

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
  cancelled?: boolean;
  issue?: boolean;
  rating?: number;
  subscriptionId?: number;
  clientName?: string;
  clientPhone?: string;
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
}

export interface BookingSelection {
  category: CategoryId;
  plan?: Plan;
}

export type RequestAction =
  | { type: "cancel" }
  | { type: "advance"; report?: string }
  | { type: "accept"; specialist?: string }
  | { type: "dismiss" }
  | { type: "decline" }
  | { type: "admin-assign"; specialist: string }
  | { type: "admin-recommend"; specialistId: number }
  | { type: "complete" }
  | { type: "issue" }
  | { type: "resolve" }
  | { type: "rate"; rating: number };
