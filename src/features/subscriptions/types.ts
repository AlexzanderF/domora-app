export type SubscriptionPlan = "HOME" | "ENTRY";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

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
