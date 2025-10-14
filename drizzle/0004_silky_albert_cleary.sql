ALTER TABLE "renewal_events" ADD COLUMN "auto_renews" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "renewal_events" ADD COLUMN "is_resolved" boolean DEFAULT false;