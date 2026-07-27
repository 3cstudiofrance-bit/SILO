-- Affectation des conseillers et seuils issus du business plan bancaire.

CREATE TABLE IF NOT EXISTS advisors (
  user_id text PRIMARY KEY,
  display_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  capacity_limit integer NOT NULL DEFAULT 80,
  warning_threshold integer NOT NULL DEFAULT 72,
  partner_portfolio_target integer NOT NULL DEFAULT 50,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT advisors_capacity_positive CHECK (capacity_limit > 0),
  CONSTRAINT advisors_warning_within_capacity
    CHECK (warning_threshold >= 0 AND warning_threshold <= capacity_limit),
  CONSTRAINT advisors_partner_target_positive
    CHECK (partner_portfolio_target >= 0)
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS advisor_user_id text;

CREATE INDEX IF NOT EXISTS projects_advisor_user_id_idx
  ON projects (advisor_user_id);

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS advisor_user_id text;

CREATE INDEX IF NOT EXISTS quotes_advisor_user_id_idx
  ON quotes (advisor_user_id);
