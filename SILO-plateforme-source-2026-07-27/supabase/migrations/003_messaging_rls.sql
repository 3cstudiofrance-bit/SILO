-- ============================================================
-- 3C STUDIO — RLS messagerie (Clerk Third-Party Auth)
-- Migration 003
--   Prérequis : Clerk configuré comme fournisseur "Third-Party Auth"
--   dans Supabase. Les jetons portent :
--     - auth.jwt()->>'sub'  = clerk_user_id
--     - role = 'authenticated'
--
--   Politiques basées sur l'APPARTENANCE à la conversation
--   (participant_ids), jamais d'accès anon large.
-- Idempotent : peut être ré-exécutée sans erreur.
-- ============================================================

-- ------------------------------------------------------------
-- Helper : id de profil de l'utilisateur Clerk courant
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM user_profiles
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- ------------------------------------------------------------
-- CONVERSATIONS
-- ------------------------------------------------------------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read conversations" ON conversations;
CREATE POLICY "Participants read conversations" ON conversations
  FOR SELECT
  TO authenticated
  USING (current_profile_id() = ANY (participant_ids));

DROP POLICY IF EXISTS "Participants create conversations" ON conversations;
CREATE POLICY "Participants create conversations" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (current_profile_id() = ANY (participant_ids));

DROP POLICY IF EXISTS "Participants update conversations" ON conversations;
CREATE POLICY "Participants update conversations" ON conversations
  FOR UPDATE
  TO authenticated
  USING (current_profile_id() = ANY (participant_ids))
  WITH CHECK (current_profile_id() = ANY (participant_ids));

-- ------------------------------------------------------------
-- MESSAGES  (RLS déjà activée en 001, mais sans politique)
-- ------------------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement les messages d'une conversation dont on est participant
DROP POLICY IF EXISTS "Participants read messages" ON messages;
CREATE POLICY "Participants read messages" ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND current_profile_id() = ANY (c.participant_ids)
    )
  );

-- Écriture : on ne peut envoyer qu'en tant que soi-même, dans une conversation dont on est participant
DROP POLICY IF EXISTS "Participants send messages" ON messages;
CREATE POLICY "Participants send messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = current_profile_id()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND current_profile_id() = ANY (c.participant_ids)
    )
  );

-- Mise à jour : accusés de lecture (read_by) par un participant de la conversation
DROP POLICY IF EXISTS "Participants update messages" ON messages;
CREATE POLICY "Participants update messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND current_profile_id() = ANY (c.participant_ids)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND current_profile_id() = ANY (c.participant_ids)
    )
  );

-- ------------------------------------------------------------
-- La RPC mark_messages_read (migration 002) doit contourner la RLS
-- pour poser les accusés de lecture des messages reçus → SECURITY DEFINER.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE messages
  SET read_by = (
    SELECT ARRAY(
      SELECT DISTINCT unnest(COALESCE(read_by, '{}') || ARRAY[p_user_id])
    )
  )
  WHERE conversation_id = p_conversation_id
    AND sender_id IS DISTINCT FROM p_user_id
    AND NOT (COALESCE(read_by, '{}') @> ARRAY[p_user_id]);
$$;
