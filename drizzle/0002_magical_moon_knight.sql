ALTER TABLE "renewal_events" DROP CONSTRAINT "renewal_events_agreement_id_agreements_id_fk";
--> statement-breakpoint
ALTER TABLE "renewal_events" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "renewal_events" ALTER COLUMN "event_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "renewal_events" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "renewal_events" ADD COLUMN "is_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "renewal_events" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "renewal_events" ADD COLUMN "shared_by" text;--> statement-breakpoint
ALTER TABLE "renewal_events" ADD COLUMN "share_token" text;