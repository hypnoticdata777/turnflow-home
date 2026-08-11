ALTER TABLE "request_tasks" ADD COLUMN "estimated_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "request_tasks" ADD COLUMN "final_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "request_tasks" ADD COLUMN "accepted_by_id" uuid;--> statement-breakpoint
ALTER TABLE "request_tasks" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;