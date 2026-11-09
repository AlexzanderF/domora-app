CREATE TYPE "public"."photo_kind" AS ENUM('BOOKING', 'REPORT');--> statement-breakpoint
ALTER TABLE "request_photos" ADD COLUMN "kind" "photo_kind" DEFAULT 'BOOKING' NOT NULL;