-- CIBLE : projet Supabase commercial SILO uniquement.
-- Ne pas appliquer au projet Academy. Cette migration suppose le schema
-- Drizzle plateforme avec projects.id integer et partner_missions.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('client-uploads', 'client-uploads', false),
  ('deliverables', 'deliverables', false),
  ('project-files', 'project-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE OR REPLACE FUNCTION public.silo_jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'publicMetadata' ->> 'role',
    auth.jwt() -> 'metadata' ->> 'role',
    'client'
  );
$$;

CREATE OR REPLACE FUNCTION public.silo_storage_project_id(object_name text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  first_segment text;
BEGIN
  first_segment := split_part(object_name, '/', 1);
  IF first_segment !~ '^[1-9][0-9]*$' THEN
    RETURN NULL;
  END IF;
  RETURN first_segment::integer;
END;
$$;

CREATE OR REPLACE FUNCTION public.silo_can_access_project(
  target_project_id integer
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.silo_jwt_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM projects
      WHERE id = target_project_id
        AND (
          client_user_id = auth.jwt() ->> 'sub'
          OR advisor_user_id = auth.jwt() ->> 'sub'
        )
    )
    OR EXISTS (
      SELECT 1
      FROM partner_missions
      WHERE partner_missions.project_id = target_project_id
        AND partner_id = auth.jwt() ->> 'sub'
    );
$$;

DROP POLICY IF EXISTS "SILO project members read private files"
  ON storage.objects;
CREATE POLICY "SILO project members read private files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('client-uploads', 'deliverables', 'project-files')
    AND public.silo_can_access_project(
      public.silo_storage_project_id(name)
    )
  );

DROP POLICY IF EXISTS "SILO clients upload project resources"
  ON storage.objects;
CREATE POLICY "SILO clients upload project resources"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('client-uploads', 'project-files')
    AND EXISTS (
      SELECT 1
      FROM projects
      WHERE id = public.silo_storage_project_id(name)
        AND client_user_id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "SILO partners upload deliverables"
  ON storage.objects;
CREATE POLICY "SILO partners upload deliverables"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deliverables'
    AND EXISTS (
      SELECT 1
      FROM partner_missions
      WHERE partner_missions.project_id =
          public.silo_storage_project_id(name)
        AND partner_id = auth.jwt() ->> 'sub'
        AND status IN ('accepte', 'en_cours', 'livre')
    )
  );

DROP POLICY IF EXISTS "SILO staff upload project files"
  ON storage.objects;
CREATE POLICY "SILO staff upload project files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('client-uploads', 'deliverables', 'project-files')
    AND (
      public.silo_jwt_role() = 'admin'
      OR EXISTS (
        SELECT 1
        FROM projects
        WHERE id = public.silo_storage_project_id(name)
          AND advisor_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

DROP POLICY IF EXISTS "SILO uploaders manage own files"
  ON storage.objects;
CREATE POLICY "SILO uploaders manage own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('client-uploads', 'deliverables', 'project-files')
    AND owner_id = auth.jwt() ->> 'sub'
  )
  WITH CHECK (
    bucket_id IN ('client-uploads', 'deliverables', 'project-files')
    AND owner_id = auth.jwt() ->> 'sub'
  );

DROP POLICY IF EXISTS "SILO uploaders delete own files"
  ON storage.objects;
CREATE POLICY "SILO uploaders delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('client-uploads', 'deliverables', 'project-files')
    AND (
      owner_id = auth.jwt() ->> 'sub'
      OR public.silo_jwt_role() = 'admin'
    )
  );
