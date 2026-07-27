-- L'ancienne jointure par clé devinable est remplacée par l'API projet,
-- qui vérifie l'appartenance et le rôle avec Clerk côté serveur.

REVOKE ALL ON FUNCTION get_or_join_conversation(text, text)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS get_or_join_conversation(text, text);

REVOKE ALL ON FUNCTION mark_messages_read(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS mark_messages_read(uuid, uuid);
