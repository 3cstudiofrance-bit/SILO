CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'lead' NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_user_id" text,
	"advisor_user_id" text,
	"description" text,
	"amount" numeric(14, 2),
	"shooting_date" date,
	"delivery_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_type" text NOT NULL,
	"status" text DEFAULT 'en_attente' NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_user_id" text,
	"advisor_user_id" text,
	"workflow_status" text DEFAULT 'new' NOT NULL,
	"wait_reason" text,
	"wait_until" timestamp,
	"follow_up_until" timestamp,
	"reserved_at" timestamp,
	"last_treated_at" timestamp,
	"closed_at" timestamp,
	"details" text,
	"budget" text,
	"amount" numeric(14, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'video' NOT NULL,
	"size" text,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"submitted_by_user_id" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"client_status" text DEFAULT 'pending' NOT NULL,
	"client_reviewed_by_user_id" text,
	"client_reviewed_at" timestamp,
	"client_review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"service_type" text NOT NULL,
	"budget" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"project_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'comment' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"partner_id" text NOT NULL,
	"partner_name" text NOT NULL,
	"title" text NOT NULL,
	"brief" text,
	"status" text DEFAULT 'en_attente' NOT NULL,
	"due_date" text,
	"rating" real,
	"notes" text,
	"amount" numeric(14, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_delegations" (
	"feature_key" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_globals" (
	"feature_key" text PRIMARY KEY NOT NULL,
	"enabled" boolean NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_key" text NOT NULL,
	"scope" text NOT NULL,
	"target" text DEFAULT '' NOT NULL,
	"enabled" boolean NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frp_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer,
	"agency_id" text NOT NULL,
	"agency_name" text NOT NULL,
	"date" date NOT NULL,
	"label" text NOT NULL,
	"project_title" text,
	"type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"title" text NOT NULL,
	"client_user_id" text,
	"agency_id" text NOT NULL,
	"agency_name" text NOT NULL,
	"advisor_user_id" text,
	"kind" text NOT NULL,
	"status" text DEFAULT 'en_attente_paiement' NOT NULL,
	"amount_ht" numeric(14, 2) NOT NULL,
	"tva" numeric(14, 2) NOT NULL,
	"ttc" numeric(14, 2) NOT NULL,
	"part_agence" numeric(14, 2) NOT NULL,
	"part_silo" numeric(14, 2) NOT NULL,
	"part_frp" numeric(14, 2) NOT NULL,
	"frais_psp_total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"frais_psp_agence" numeric(14, 2) DEFAULT 0 NOT NULL,
	"frais_psp_silo" numeric(14, 2) DEFAULT 0 NOT NULL,
	"part_agence_apres_psp" numeric(14, 2) DEFAULT 0 NOT NULL,
	"part_silo_apres_psp" numeric(14, 2) DEFAULT 0 NOT NULL,
	"reserve_incidents" numeric(14, 2) DEFAULT 0 NOT NULL,
	"prime_conseiller" numeric(14, 2) DEFAULT 0 NOT NULL,
	"contribution_silo_apres_variables" numeric(14, 2) DEFAULT 0 NOT NULL,
	"calculation_version" text DEFAULT 'bp-2026-07-25-v1' NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comm_global" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"blocage_global" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comm_project_settings" (
	"project_id" text PRIMARY KEY NOT NULL,
	"admin_autorise_pm" boolean DEFAULT false NOT NULL,
	"active_par_pm" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"type" text NOT NULL,
	"channel" text,
	"author_name" text NOT NULL,
	"author_role" text NOT NULL,
	"author_user_id" text,
	"counterparty_user_id" text,
	"recipient" text,
	"content" text NOT NULL,
	"status" text,
	"attachment_name" text,
	"attachment_size" text,
	"attachment_kind" text,
	"duration_sec" integer,
	"score_value" real,
	"internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"external_id" text NOT NULL,
	"event_type" text NOT NULL,
	"status" text,
	"error_code" text,
	"project_id" integer,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisors" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"capacity_limit" integer DEFAULT 80 NOT NULL,
	"warning_threshold" integer DEFAULT 72 NOT NULL,
	"partner_portfolio_target" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"portfolio_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"advisor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"client_user_id" text NOT NULL,
	"partner_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text,
	"size_bytes" bigint NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"source_role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_stripe_checkout_session_key" ON "transactions" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_stripe_payment_intent_key" ON "transactions" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_idempotency_key" ON "webhook_events" USING btree ("provider","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_user_id_key" ON "partners" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_reviews_mission_key" ON "partner_reviews" USING btree ("mission_id");--> statement-breakpoint

-- These tables are consumed exclusively by the authenticated Express API.
-- Keep them unreachable from Supabase's public Data API. The Cloud Run
-- runtime connects as the database owner and therefore continues to use them.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'projects',
    'quotes',
    'deliverables',
    'contacts',
    'activity',
    'comments',
    'partner_missions',
    'feature_flag_delegations',
    'feature_flag_globals',
    'feature_flag_overrides',
    'frp_movements',
    'transactions',
    'comm_global',
    'comm_project_settings',
    'feed_entries',
    'webhook_events',
    'advisors',
    'partners',
    'partner_reviews',
    'project_files'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated',
      table_name
    );
  END LOOP;
END
$$;
