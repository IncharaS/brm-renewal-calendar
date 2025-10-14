ALTER TABLE "agreements" ALTER COLUMN "vendor_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "agreements" ALTER COLUMN "vendor_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agreements" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "agreements" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agreements" ALTER COLUMN "auto_renews" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "agreements" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "agreements" DROP COLUMN "created_at";