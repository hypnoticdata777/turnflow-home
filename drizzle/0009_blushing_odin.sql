CREATE TYPE "public"."closeout_submission_status" AS ENUM('pending', 'approved', 'changes_requested');--> statement-breakpoint
ALTER TABLE "closeout_submissions" ADD COLUMN "status" "closeout_submission_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "closeout_submissions" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "closeout_submissions" ADD COLUMN "reviewed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "closeout_submissions" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "closeout_submissions" ADD CONSTRAINT "closeout_submissions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;