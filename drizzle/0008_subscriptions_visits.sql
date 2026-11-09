ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_unique";--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "subscription_id" integer;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "requests_subscription_id_idx" ON "requests" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_one_active_idx" ON "subscriptions" USING btree ("user_id") WHERE "subscriptions"."status" = 'ACTIVE';