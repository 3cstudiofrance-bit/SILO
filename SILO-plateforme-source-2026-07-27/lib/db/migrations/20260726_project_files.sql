-- Registre canonique des ressources partagees sur un projet. Les objets restent
-- prives dans Supabase Storage et sont ouverts via des URL signees temporaires.

CREATE TABLE IF NOT EXISTS project_files (
  id serial PRIMARY KEY,
  project_id integer NOT NULL,
  name text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL,
  uploaded_by_user_id text NOT NULL,
  source_role text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_files_project_created_idx
  ON project_files (project_id, created_at DESC);
