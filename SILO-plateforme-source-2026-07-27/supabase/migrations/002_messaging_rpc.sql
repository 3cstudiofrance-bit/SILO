-- ============================================================
-- 3C STUDIO — Messagerie temps réel (compléments)
-- Migration 002
--   - Fonction RPC mark_messages_read (appelée par messageService.markAsRead)
--   - Realtime pour la table conversations (mise à jour de last_message_at)
--   - Trigger: last_message_at maintenu à jour à chaque nouveau message
-- Idempotent : peut être ré-exécutée sans erreur.
-- ============================================================

-- ------------------------------------------------------------
-- RPC : marque tous les messages d'une conversation comme lus
-- pour l'utilisateur donné (ajoute son id dans read_by).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE sql
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

-- ------------------------------------------------------------
-- Trigger : maintient conversations.last_message_at à jour
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation_last_message ON messages;
CREATE TRIGGER trg_touch_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION touch_conversation_last_message();

-- ------------------------------------------------------------
-- Realtime : activer la diffusion pour conversations
-- (last_message_at pour rafraîchir la liste des conversations)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;
