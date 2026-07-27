-- Etat operationnel du conseiller, distinct du statut commercial du devis.

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS wait_reason text,
  ADD COLUMN IF NOT EXISTS wait_until timestamp,
  ADD COLUMN IF NOT EXISTS follow_up_until timestamp,
  ADD COLUMN IF NOT EXISTS reserved_at timestamp,
  ADD COLUMN IF NOT EXISTS last_treated_at timestamp,
  ADD COLUMN IF NOT EXISTS closed_at timestamp;

UPDATE quotes
SET
  workflow_status = CASE
    WHEN status IN ('accepte', 'refuse') THEN 'closed'
    WHEN advisor_user_id IS NOT NULL THEN 'in_progress'
    ELSE 'new'
  END,
  reserved_at = CASE
    WHEN advisor_user_id IS NOT NULL THEN updated_at
    ELSE reserved_at
  END,
  closed_at = CASE
    WHEN status IN ('accepte', 'refuse') THEN updated_at
    ELSE closed_at
  END
WHERE workflow_status = 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotes_workflow_status_allowed'
  ) THEN
    ALTER TABLE quotes
      ADD CONSTRAINT quotes_workflow_status_allowed
      CHECK (
        workflow_status IN (
          'new',
          'in_progress',
          'waiting',
          'follow_up',
          'closed'
        )
      )
      NOT VALID;
  END IF;
END
$$;
