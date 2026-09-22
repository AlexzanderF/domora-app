export const SubscriptionPlan = {
  Home: "HOME",
  Entry: "ENTRY",
} as const;
export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  Active: "ACTIVE",
  Cancelled: "CANCELLED",
  Expired: "EXPIRED",
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface Subscription {
  id: number;
  userId: number;
  planType: SubscriptionPlan;
  propertyAddress: string;
  propertyArea: number;
  status: SubscriptionStatus;
  visitsRemaining: number;
  validUntil: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanTierConfig {
  readonly planType: SubscriptionPlan;
  readonly name: string;
  readonly description: string;
  readonly priceDisplay: string;
  readonly unitDisplay: string;
  readonly features: readonly string[];
  readonly badge?: string;
}
