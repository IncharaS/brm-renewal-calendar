CREATE TABLE "agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"effective_date" timestamp,
	"initial_term_months" integer,
	"auto_renews" boolean DEFAULT false,
	"renewal_term_months" integer,
	"notice_period_days" integer,
	"raw_text" text,
	"source_file" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "renewal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"kind" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "renewal_events" ADD CONSTRAINT "renewal_events_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE no action ON UPDATE no action;