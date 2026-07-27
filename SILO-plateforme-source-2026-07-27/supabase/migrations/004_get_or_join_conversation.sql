-- ============================================================
-- 3C STUDIO — Jointure de conversation par clé stable (RLS-safe)
-- Migration 004
--
-- Problème résolu :
--   Sous RLS (migration 003), un utilisateur ne peut PAS "découvrir"
--   une conversation dont il n'est pas encore participant. Deux comptes
--   ne peuvent donc jamais converger sur une même conversation via un
--   simple SELECT/UPSERT côté client.
--
-- Solution :
--   Une RPC SECURITY DEFINER qui, à partir d'une clé stable (stockée
--   dans `title`), récupère la conversation existante ou la crée, puis
--   ajoute l'appelant à `participant_ids` s'il n'y est pas déjà.
--   L'identité est dérivée du JWT Clerk (auth.jwt()->>'sub').
--
-- Sécurité (durcissements) :
--   1. Index UNIQUE (type, title) : évite les conversations dupliquées
--      pour une même clé sous concurrence (course SELECT-puis-INSERT).
--   2. Plafond de participants : ces canaux sont strictement 1:1
--      (client↔chef de projet, chef de projet↔agence). Une fois la paire
--      constituée, tout tiers qui devinerait la clé est REJETÉ — parade
--      contre l'auto-inscription (IDOR).
--   3. INSERT ... ON CONFLICT : jointure atomique, sûre en concurrence.
--
-- Idempotent : peut être ré-exécutée sans erreur.
-- ============================================================

-- Unicité de la clé stable → une seule conversation par (type, title).
CREATE UNIQUE INDEX IF NOT EXISTS conversations_type_title_key
  ON conversations (type, title)
  WHERE title IS NOT NULL;

-- Nombre maximum de participants pour un canal keyé (1:1).
-- Modifier ici si un canal de groupe keyé est introduit plus tard.
CREATE OR REPLACE FUNCTION get_or_join_conversation(
  p_key  TEXT,
  p_type TEXT DEFAULT 'direct'
)
RETURNS conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile   uuid;
  v_conv      conversations;
  v_max_seats CONSTANT int := 2;
BEGIN
  -- Profil Supabase de l'utilisateur Clerk courant
  SELECT id INTO v_profile
  FROM user_profiles
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;

  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'Aucun profil pour l''utilisateur courant (sync requise)';
  END IF;

  -- Création atomique si absente ; sinon récupère l'existante.
  -- ON CONFLICT garantit qu'une seule conversation existe par clé,
  -- même sous appels concurrents.
  INSERT INTO conversations (type, title, participant_ids)
  VALUES (p_type, p_key, ARRAY[v_profile])
  ON CONFLICT (type, title) WHERE title IS NOT NULL
  DO UPDATE SET title = EXCLUDED.title  -- no-op pour renvoyer la ligne existante
  RETURNING * INTO v_conv;

  -- Déjà participant → rien à faire.
  IF v_profile = ANY (v_conv.participant_ids) THEN
    RETURN v_conv;
  END IF;

  -- Contrôle d'accès : canal 1:1 déjà complet → refus (anti auto-inscription).
  IF array_length(v_conv.participant_ids, 1) >= v_max_seats THEN
    RAISE EXCEPTION 'Conversation complète : accès refusé (%).', p_key
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Jointure atomique du second participant (garde le plafond côté SQL).
  UPDATE conversations
  SET participant_ids = participant_ids || v_profile
  WHERE id = v_conv.id
    AND NOT (v_profile = ANY (participant_ids))
    AND array_length(participant_ids, 1) < v_max_seats
  RETURNING * INTO v_conv;

  IF v_conv.id IS NULL THEN
    -- Un autre appelant a pris la dernière place entre-temps.
    RAISE EXCEPTION 'Conversation complète : accès refusé (%).', p_key
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN v_conv;
END;
$$;
