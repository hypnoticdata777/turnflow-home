CREATE TYPE "public"."billing_record_status" AS ENUM('recorded', 'paid', 'disputed', 'void');--> statement-breakpoint
CREATE TABLE "billing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"vendor_id" uuid,
	"closeout_submission_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"status" "billing_record_status" DEFAULT 'recorded' NOT NULL,
	"invoice_reference" varchar(120),
	"notes" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_records_closeout_submission_id_unique" UNIQUE("closeout_submission_id")
);
--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_closeout_submission_id_closeout_submissions_id_fk" FOREIGN KEY ("closeout_submission_id") REFERENCES "public"."closeout_submissions"("id") ON DELETE set null ON UPDATE no action;