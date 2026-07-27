-- Journal d'idempotence partage par les webhooks de prestataires.
-- Aucun numero, contenu de message ou payload brut n'est conserve.

CREATE TABLE IF NOT EXISTS webhook_events (
  id serial PRIMARY KEY,
  provider text NOT NULL,
  idempotency_key text NOT NULL,
  external_id text NOT NULL,
  event_type text NOT NULL,
  status text,
  error_code text,
  project_id integer,
  received_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_idempotency_key
  ON webhook_events (provider, idempotency_key);
