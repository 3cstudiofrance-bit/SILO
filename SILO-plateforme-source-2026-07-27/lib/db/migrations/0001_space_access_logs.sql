CREATE TABLE "space_access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text,
	"user_name" text,
	"role" text NOT NULL,
	"space" text NOT NULL,
	"path" text NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "space_access_logs_user_idx" ON "space_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "space_access_logs_accessed_at_idx" ON "space_access_logs" USING btree ("accessed_at");--> statement-breakpoint
ALTER TABLE "space_access_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "space_access_logs" FROM anon, authenticated;
