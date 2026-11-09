import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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

export const requestStatusEnum = pgEnum("request_status", [
  "CREATED",
  "ACCEPTED",
  "IN_PROGRESS",
  "AWAITING_CONFIRMATION",
  "COMPLETED",
]);

// Booking photos are the client's; report photos are the specialist's, on the
// work completion report.
export const photoKindEnum = pgEnum("photo_kind", ["BOOKING", "REPORT"]);

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
  propertyAddress: text("property_address"),
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

export const sessions = pgTable(
  "sessions",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

// Password reset links. Only the sha256 digest is stored, like session tokens.
// usedAt is set when the link is used or replaced by a newer one.
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("password_reset_tokens_user_id_idx").on(table.userId)],
);

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

export const requests = pgTable(
  "requests",
  {
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
    status: requestStatusEnum("status").notNull().default("CREATED"),
    price: integer("price").notNull(),
    clientPhone: text("client_phone").notNull(),
    // The client's preferred visit: a calendar day plus the time-window label
    // picked in the booking dialog (e.g. "09:00 - 12:00"). Null on rows that
    // predate the columns.
    scheduledDate: date("scheduled_date", { mode: "string" }),
    scheduledTime: text("scheduled_time"),
    cancelled: boolean("cancelled").notNull().default(false),
    report: text("report"),
    rating: integer("rating"),
    issue: boolean("issue").notNull().default(false),
    issueNote: text("issue_note"),
    recommendedSpecialistId: integer("recommended_specialist_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    // Who recommended the request to recommendedSpecialistId, and when.
    recommendedById: integer("recommended_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    recommendedAt: timestamp("recommended_at", { withTimezone: true }),
    dispatchedByAdmin: boolean("dispatched_by_admin").notNull().default(false),
    // The subscription whose visit this request consumed, if it was booked
    // against one.
    subscriptionId: integer("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    reportSubmittedAt: timestamp("report_submitted_at", {
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ratedAt: timestamp("rated_at", { withTimezone: true }),
    issueOpenedAt: timestamp("issue_opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "requests_rating_range",
      sql`${table.rating} IS NULL OR (${table.rating} >= 1 AND ${table.rating} <= 5)`,
    ),
    index("requests_client_id_idx").on(table.clientId),
    index("requests_specialist_id_idx").on(table.specialistId),
    index("requests_status_idx").on(table.status),
    index("requests_subscription_id_idx").on(table.subscriptionId),
  ],
);

// Append-only audit trail of request lifecycle changes, written in the same
// transaction as the change itself.
export const requestEvents = pgTable(
  "request_events",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    requestId: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    actorId: integer("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    fromStatus: requestStatusEnum("from_status"),
    toStatus: requestStatusEnum("to_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("request_events_request_id_idx").on(table.requestId)],
);

// Every issue a client raises on a request. Resolving stamps the row instead
// of deleting it, so the full dispute history survives; the request's own
// issue flag only mirrors whether one is currently open.
export const requestDisputes = pgTable(
  "request_disputes",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    requestId: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    raisedById: integer("raised_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note").notNull(),
    raisedAt: timestamp("raised_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedById: integer("resolved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("request_disputes_request_id_idx").on(table.requestId),
    // At most one open dispute per request.
    uniqueIndex("request_disputes_one_open_idx")
      .on(table.requestId)
      .where(sql`${table.resolvedAt} IS NULL`),
  ],
);

// Photos attached to a request: the client's at booking, the specialist's on
// the work completion report (see `kind`). The bytes live in the PhotoStore
// under `storageKey` (a random UUID filename); only this row says who may see
// them, via the request.
export const requestPhotos = pgTable(
  "request_photos",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    requestId: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    kind: photoKindEnum("kind").notNull().default("BOOKING"),
    storageKey: text("storage_key").notNull().unique(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedById: integer("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("request_photos_request_id_idx").on(table.requestId)],
);

// A client may keep several subscriptions over time (cancelled and expired
// ones stay as history) but only one ACTIVE one.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: integer("user_id")
      .notNull()
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
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    uniqueIndex("subscriptions_one_active_idx")
      .on(table.userId)
      .where(sql`${table.status} = 'ACTIVE'`),
  ],
);

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

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

// Versioned domain events, inserted in the same transaction as the state
// change they describe. The worker fans each one out into deliveries once.
export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    type: text("type").notNull(),
    version: integer("version").notNull().default(1),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    fannedOutAt: timestamp("fanned_out_at", { withTimezone: true }),
  },
  (table) => [
    index("outbox_events_pending_idx")
      .on(table.id)
      .where(sql`${table.fannedOutAt} IS NULL`),
  ],
);

// One row per event + recipient + channel; the unique key is what stops a
// re-run from sending the same notification twice.
export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    eventId: integer("event_id")
      .notNull()
      .references(() => outboxEvents.id, { onDelete: "cascade" }),
    recipient: text("recipient").notNull(),
    channel: text("channel").notNull().default("email"),
    template: text("template").notNull(),
    data: jsonb("data").notNull(),
    status: notificationStatusEnum("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_event_recipient_channel_idx").on(
      table.eventId,
      table.recipient,
      table.channel,
    ),
    index("notification_deliveries_due_idx")
      .on(table.nextAttemptAt)
      .where(sql`${table.status} = 'PENDING'`),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  specialistProfile: one(specialistProfiles),
  subscriptions: many(subscriptions),
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
export type RequestEventSelect = typeof requestEvents.$inferSelect;
export type RequestEventInsert = typeof requestEvents.$inferInsert;
export type RequestDisputeSelect = typeof requestDisputes.$inferSelect;
export type RequestPhotoSelect = typeof requestPhotos.$inferSelect;
export type SubscriptionSelect = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = typeof subscriptions.$inferInsert;
export type TariffSelect = typeof tariffs.$inferSelect;
export type TariffInsert = typeof tariffs.$inferInsert;
export type OutboxEventSelect = typeof outboxEvents.$inferSelect;
export type NotificationDeliverySelect =
  typeof notificationDeliveries.$inferSelect;
