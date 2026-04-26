CREATE TYPE "public"."lead_measure_status" AS ENUM('scheduled', 'completed');--> statement-breakpoint
CREATE TABLE "lead_measures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wig_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "lead_measure_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_measures" ADD CONSTRAINT "lead_measures_wig_id_wigs_id_fk" FOREIGN KEY ("wig_id") REFERENCES "public"."wigs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lead_measures_wig_id_idx" ON "lead_measures" USING btree ("wig_id");
--> statement-breakpoint
CREATE INDEX "lead_measures_status_idx" ON "lead_measures" USING btree ("status");
