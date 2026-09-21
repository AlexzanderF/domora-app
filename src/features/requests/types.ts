export type Role = "client" | "specialist" | "admin";
export type Plan = "home" | "entry";
export type CategoryId = 0 | 1 | 2 | 3 | 4 | 5;
export type RequestStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface ServiceRequest {
  id: string;
  category: CategoryId;
  service: string;
  address: string;
  date: string;
  time: string;
  price: number;
  status: RequestStatus;
  description: string;
  plan?: Plan;
  visitsPerMonth?: number;
  propertySize?: number;
  specialist?: string;
  recommendedSpecialistId?: string;
  report?: string;
  cancelled?: boolean;
  issue?: boolean;
  rating?: number;
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
  | { type: "admin-recommend"; specialistId: string }
  | { type: "complete" }
  | { type: "issue" }
  | { type: "rate"; rating: number };
