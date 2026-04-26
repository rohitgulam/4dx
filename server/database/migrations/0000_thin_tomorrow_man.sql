CREATE TYPE "public"."auth_providers" AS ENUM('email', 'google');--> statement-breakpoint
CREATE TYPE "public"."lead_measure_status" AS ENUM('scheduled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."weekly_accountability_status" AS ENUM('winning', 'at-risk', 'behind');--> statement-breakpoint
CREATE TYPE "public"."workspace_member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_providers" NOT NULL,
	"provider_user_id" varchar(255),
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "auth_accounts_user_id_provider_unique" UNIQUE("user_id","provider"),
	CONSTRAINT "auth_accounts_provider_provider_user_id_unique" UNIQUE("provider","provider_user_id")
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
CREATE TABLE "wigs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"unit" text NOT NULL,
	"start_value" integer NOT NULL,
	"current_value" integer NOT NULL,
	"target_value" integer NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_member_role" DEFAULT 'member' NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_measures" ADD CONSTRAINT "lead_measures_wig_id_wigs_id_fk" FOREIGN KEY ("wig_id") REFERENCES "public"."wigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_accountability" ADD CONSTRAINT "weekly_accountability_wig_id_wigs_id_fk" FOREIGN KEY ("wig_id") REFERENCES "public"."wigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wigs" ADD CONSTRAINT "wigs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wigs" ADD CONSTRAINT "wigs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_measures_wig_id_idx" ON "lead_measures" USING btree ("wig_id");--> statement-breakpoint
CREATE INDEX "lead_measures_status_idx" ON "lead_measures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "weekly_accountability_wig_id_idx" ON "weekly_accountability" USING btree ("wig_id");--> statement-breakpoint
CREATE INDEX "wigs_workspace_id_idx" ON "wigs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "wigs_created_by_user_id_idx" ON "wigs" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");