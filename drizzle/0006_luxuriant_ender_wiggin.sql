CREATE TYPE "public"."request_task_status" AS ENUM('todo', 'in_progress', 'blocked', 'done');--> statement-breakpoint
CREATE TABLE "request_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "request_task_status" DEFAULT 'todo' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required_photo_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_sessions" ADD COLUMN "request_task_id" uuid;--> statement-breakpoint
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_sessions" ADD CONSTRAINT "work_sessions_request_task_id_request_tasks_id_fk" FOREIGN KEY ("request_task_id") REFERENCES "public"."request_tasks"("id") ON DELETE set null ON UPDATE no action;