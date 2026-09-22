import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "CLIENT",
  "SPECIALIST",
  "ADMIN",
]);

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "PENDING",
  "REJECTED",
]);

export const requestPriorityEnum = pgEnum("request_priority", [
  "STANDARD",
  "URGENT",
  "HOLIDAY",
  "EMERGENCY",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "HOME",
  "ENTRY",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("CLIENT"),
  status: userStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const specialistProfiles = pgTable("specialist_profiles", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  area: text("area").notNull(),
  experienceYears: integer("experience_years").notNull(),
  bio: text("bio").notNull(),
  companyName: text("company_name"),
  eik: text("eik"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const requests = pgTable("requests", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  clientId: integer("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  specialistId: integer("specialist_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  address: text("address").notNull(),
  priority: requestPriorityEnum("priority").notNull().default("STANDARD"),
  status: integer("status").notNull().default(0),
  price: integer("price").notNull(),
  clientPhone: text("client_phone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  planType: subscriptionPlanEnum("plan_type").notNull(),
  propertyAddress: text("property_address").notNull(),
  propertyArea: integer("property_area").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  visitsRemaining: integer("visits_remaining").notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tariffs = pgTable("tariffs", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  category: text("category").notNull().unique(),
  standardRate: integer("standard_rate").notNull(),
  urgentRate: integer("urgent_rate").notNull(),
  holidayRate: integer("holiday_rate").notNull(),
  emergencyRate: integer("emergency_rate").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  specialistProfile: one(specialistProfiles),
  subscription: one(subscriptions),
  clientRequests: many(requests, { relationName: "clientRequests" }),
  specialistRequests: many(requests, { relationName: "specialistRequests" }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const specialistProfilesRelations = relations(
  specialistProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [specialistProfiles.userId],
      references: [users.id],
    }),
  }),
);

export const requestsRelations = relations(requests, ({ one }) => ({
  client: one(users, {
    fields: [requests.clientId],
    references: [users.id],
    relationName: "clientRequests",
  }),
  specialist: one(users, {
    fields: [requests.specialistId],
    references: [users.id],
    relationName: "specialistRequests",
  }),
}));

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type SessionSelect = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export type SpecialistProfileSelect = typeof specialistProfiles.$inferSelect;
export type SpecialistProfileInsert = typeof specialistProfiles.$inferInsert;
export type RequestSelect = typeof requests.$inferSelect;
export type RequestInsert = typeof requests.$inferInsert;
export type SubscriptionSelect = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = typeof subscriptions.$inferInsert;
export type TariffSelect = typeof tariffs.$inferSelect;
export type TariffInsert = typeof tariffs.$inferInsert;
