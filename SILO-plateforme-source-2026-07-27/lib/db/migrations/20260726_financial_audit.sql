-- Complete le modele financier avec les hypotheses du business plan bancaire
-- du 25 juillet 2026. Cette migration est preparee pour la base plateforme et
-- ne doit pas etre appliquee au projet Supabase Academy.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS advisor_user_id text,
  ADD COLUMN IF NOT EXISTS frais_psp_total numeric(14, 2),
  ADD COLUMN IF NOT EXISTS frais_psp_agence numeric(14, 2),
  ADD COLUMN IF NOT EXISTS frais_psp_silo numeric(14, 2),
  ADD COLUMN IF NOT EXISTS part_agence_apres_psp numeric(14, 2),
  ADD COLUMN IF NOT EXISTS part_silo_apres_psp numeric(14, 2),
  ADD COLUMN IF NOT EXISTS reserve_incidents numeric(14, 2),
  ADD COLUMN IF NOT EXISTS prime_conseiller numeric(14, 2),
  ADD COLUMN IF NOT EXISTS contribution_silo_apres_variables numeric(14, 2),
  ADD COLUMN IF NOT EXISTS calculation_version text;

WITH calculated AS (
  SELECT
    id,
    round(amount_ht * 0.02, 2) AS psp_total,
    round(round(amount_ht * 0.02, 2) * 7 / 9, 2) AS psp_agence,
    round(amount_ht * 0.005, 2) AS reserve
  FROM transactions
)
UPDATE transactions AS transaction
SET
  frais_psp_total = calculated.psp_total,
  frais_psp_agence = calculated.psp_agence,
  frais_psp_silo = calculated.psp_total - calculated.psp_agence,
  part_agence_apres_psp =
    transaction.part_agence - calculated.psp_agence,
  part_silo_apres_psp =
    transaction.part_silo - (calculated.psp_total - calculated.psp_agence),
  reserve_incidents = calculated.reserve,
  prime_conseiller = 0,
  contribution_silo_apres_variables =
    transaction.part_silo
    - (calculated.psp_total - calculated.psp_agence)
    - calculated.reserve,
  calculation_version = 'backfill-bp-2026-07-25-v1'
FROM calculated
WHERE calculated.id = transaction.id
  AND transaction.calculation_version IS NULL;

ALTER TABLE transactions
  ALTER COLUMN frais_psp_total SET DEFAULT 0,
  ALTER COLUMN frais_psp_total SET NOT NULL,
  ALTER COLUMN frais_psp_agence SET DEFAULT 0,
  ALTER COLUMN frais_psp_agence SET NOT NULL,
  ALTER COLUMN frais_psp_silo SET DEFAULT 0,
  ALTER COLUMN frais_psp_silo SET NOT NULL,
  ALTER COLUMN part_agence_apres_psp SET DEFAULT 0,
  ALTER COLUMN part_agence_apres_psp SET NOT NULL,
  ALTER COLUMN part_silo_apres_psp SET DEFAULT 0,
  ALTER COLUMN part_silo_apres_psp SET NOT NULL,
  ALTER COLUMN reserve_incidents SET DEFAULT 0,
  ALTER COLUMN reserve_incidents SET NOT NULL,
  ALTER COLUMN prime_conseiller SET DEFAULT 0,
  ALTER COLUMN prime_conseiller SET NOT NULL,
  ALTER COLUMN contribution_silo_apres_variables SET DEFAULT 0,
  ALTER COLUMN contribution_silo_apres_variables SET NOT NULL,
  ALTER COLUMN calculation_version SET DEFAULT 'bp-2026-07-25-v1',
  ALTER COLUMN calculation_version SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS frp_movements_transaction_credit_key
  ON frp_movements (transaction_id, type)
  WHERE transaction_id IS NOT NULL AND type = 'credit';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_split_matches_ht'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_split_matches_ht
      CHECK (part_agence + part_silo + part_frp = amount_ht)
      NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_financial_amounts_nonnegative'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_financial_amounts_nonnegative
      CHECK (
        amount_ht >= 0
        AND part_agence >= 0
        AND part_silo >= 0
        AND part_frp >= 0
        AND frais_psp_total >= 0
        AND frais_psp_agence >= 0
        AND frais_psp_silo >= 0
        AND reserve_incidents >= 0
        AND prime_conseiller >= 0
      )
      NOT VALID;
  END IF;
END
$$;
