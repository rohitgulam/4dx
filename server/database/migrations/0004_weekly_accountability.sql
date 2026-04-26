CREATE TYPE "public"."weekly_accountability_status" AS ENUM('winning', 'at-risk', 'behind');--> statement-breakpoint
CREATE TABLE "weekly_accountability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wig_id" uuid NOT NULL,
	"week_start_date" timestamp with time zone NOT NULL,
	"status" "weekly_accountability_status" DEFAULT 'at-risk' NOT NULL,
	"summary" text NOT NULL,
	"next_commitment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_accountability_wig_id_week_start_date_unique" UNIQUE("wig_id","week_start_date")
);
--> statement-breakpoint
ALTER TABLE "weekly_accountability" ADD CONSTRAINT "weekly_accountability_wig_id_wigs_id_fk" FOREIGN KEY ("wig_id") REFERENCES "public"."wigs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "weekly_accountability_wig_id_idx" ON "weekly_accountability" USING btree ("wig_id");
