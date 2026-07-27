-- Isole les conversations de chaque partenaire au sein d'un même projet.

ALTER TABLE feed_entries
  ADD COLUMN IF NOT EXISTS counterparty_user_id text;

CREATE INDEX IF NOT EXISTS feed_entries_partner_channel_idx
  ON feed_entries (project_id, channel, counterparty_user_id);
