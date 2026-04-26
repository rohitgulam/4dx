CREATE TABLE "wigs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"unit" text NOT NULL,
	"start_value" integer NOT NULL,
	"current_value" integer NOT NULL,
	"target_value" integer NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wigs" ADD CONSTRAINT "wigs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wigs" ADD CONSTRAINT "wigs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "wigs_workspace_id_idx" ON "wigs" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "wigs_created_by_user_id_idx" ON "wigs" USING btree ("created_by_user_id");
