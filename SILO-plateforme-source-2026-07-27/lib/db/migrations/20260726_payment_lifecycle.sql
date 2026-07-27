-- Les allocations financieres sont preparees avant paiement, puis reconnues
-- uniquement apres confirmation d'un webhook Stripe signe.

ALTER TABLE transactions
  ALTER COLUMN status SET DEFAULT 'en_attente_paiement',
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_checkout_session_key
  ON transactions (stripe_checkout_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_payment_intent_key
  ON transactions (stripe_payment_intent_id);

CREATE UNIQUE INDEX IF NOT EXISTS frp_movements_transaction_credit_key
  ON frp_movements (transaction_id, type)
  WHERE transaction_id IS NOT NULL AND type = 'credit';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_payment_status_allowed'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_payment_status_allowed
      CHECK (
        status IN (
          'en_attente_paiement',
          'confirmee',
          'echouee',
          'annulee',
          'remboursee'
        )
      )
      NOT VALID;
  END IF;
END
$$;
