ALTER TABLE "quotes" ADD COLUMN "submitted_by_vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "availability_window" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_submitted_by_vendor_id_users_id_fk" FOREIGN KEY ("submitted_by_vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;