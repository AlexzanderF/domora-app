CREATE TABLE "pricing_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"diagnostic_fee" integer DEFAULT 25 NOT NULL,
	"volume_discount_min_visits" integer DEFAULT 4 NOT NULL,
	"volume_discount_percent" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_settings_single_row" CHECK ("pricing_settings"."id" = 1),
	CONSTRAINT "pricing_settings_diagnostic_fee_range" CHECK ("pricing_settings"."diagnostic_fee" between 1 and 10000),
	CONSTRAINT "pricing_settings_min_visits_range" CHECK ("pricing_settings"."volume_discount_min_visits" between 1 and 8),
	CONSTRAINT "pricing_settings_discount_percent_range" CHECK ("pricing_settings"."volume_discount_percent" between 0 and 100)
);
--> statement-breakpoint
INSERT INTO "pricing_settings" ("id") VALUES (1);
