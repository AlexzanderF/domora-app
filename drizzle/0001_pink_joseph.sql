ALTER TABLE "requests" ADD COLUMN "cancelled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "report" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "issue" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "issue_note" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "recommended_specialist_id" integer;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "dispatched_by_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_recommended_specialist_id_users_id_fk" FOREIGN KEY ("recommended_specialist_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_rating_range" CHECK ("requests"."rating" IS NULL OR ("requests"."rating" >= 1 AND "requests"."rating" <= 5));