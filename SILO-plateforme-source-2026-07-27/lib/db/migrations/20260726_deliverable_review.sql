-- Contrôle qualité des livrables avant exposition au client.

ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS submitted_by_user_id text,
  ADD COLUMN IF NOT EXISTS reviewed_by_user_id text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp,
  ADD COLUMN IF NOT EXISTS review_notes text;

ALTER TABLE deliverables
  DROP CONSTRAINT IF EXISTS deliverables_status_check;

ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_status_check
    CHECK (status IN ('pending_review', 'approved', 'changes_requested'));

ALTER TABLE deliverables
  DROP CONSTRAINT IF EXISTS deliverables_version_positive;

ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_version_positive CHECK (version > 0);

CREATE INDEX IF NOT EXISTS deliverables_project_status_idx
  ON deliverables (project_id, status);

CREATE INDEX IF NOT EXISTS deliverables_submitter_idx
  ON deliverables (submitted_by_user_id);
