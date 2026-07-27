-- La revue qualite SILO et la validation finale du client sont deux decisions
-- distinctes. Le client ne peut agir qu'apres approbation SILO.

ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS client_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS client_reviewed_by_user_id text,
  ADD COLUMN IF NOT EXISTS client_reviewed_at timestamp,
  ADD COLUMN IF NOT EXISTS client_review_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deliverables_client_status_allowed'
  ) THEN
    ALTER TABLE deliverables
      ADD CONSTRAINT deliverables_client_status_allowed
      CHECK (
        client_status IN ('pending', 'approved', 'changes_requested')
      )
      NOT VALID;
  END IF;
END
$$;
