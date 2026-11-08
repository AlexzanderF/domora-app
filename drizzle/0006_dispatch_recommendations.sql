ALTER TABLE "requests" ADD COLUMN "recommended_by_id" integer;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "recommended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_recommended_by_id_users_id_fk" FOREIGN KEY ("recommended_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;