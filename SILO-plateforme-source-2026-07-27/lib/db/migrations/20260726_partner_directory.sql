-- Annuaire partenaires et rattachement au portefeuille d'un conseiller.

CREATE TABLE IF NOT EXISTS partners (
  id serial PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  email text NOT NULL,
  phone text,
  city text,
  specialties jsonb NOT NULL DEFAULT '[]'::jsonb,
  portfolio_url text,
  status text NOT NULL DEFAULT 'pending',
  advisor_user_id text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT partners_kind_allowed
    CHECK (kind IN ('agency', 'individual')),
  CONSTRAINT partners_status_allowed
    CHECK (status IN ('pending', 'active', 'suspended', 'rejected'))
);

CREATE UNIQUE INDEX IF NOT EXISTS partners_user_id_key
  ON partners (user_id);

CREATE INDEX IF NOT EXISTS partners_advisor_user_id_idx
  ON partners (advisor_user_id);
