ALTER TABLE "documents" ALTER COLUMN "content" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "content" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;