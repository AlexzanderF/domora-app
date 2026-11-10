-- Normalize the Home rate to tenths of a lev per m2 (the old reader treated 20 or less as lev).
UPDATE "tariffs" SET "standard_rate" = "standard_rate" * 10 WHERE "category" = 'home' AND "standard_rate" <= 20;--> statement-breakpoint
ALTER TABLE "tariffs" DROP COLUMN "urgent_rate";--> statement-breakpoint
ALTER TABLE "tariffs" DROP COLUMN "holiday_rate";--> statement-breakpoint
ALTER TABLE "tariffs" DROP COLUMN "emergency_rate";