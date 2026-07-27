-- Une mission validee ne peut recevoir qu'une evaluation du client du projet.

CREATE TABLE IF NOT EXISTS partner_reviews (
  id serial PRIMARY KEY,
  mission_id integer NOT NULL,
  project_id integer NOT NULL,
  client_user_id text NOT NULL,
  partner_id text NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_reviews_mission_key
  ON partner_reviews (mission_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'partner_reviews_rating_range'
  ) THEN
    ALTER TABLE partner_reviews
      ADD CONSTRAINT partner_reviews_rating_range
      CHECK (rating BETWEEN 1 AND 5)
      NOT VALID;
  END IF;
END
$$;
