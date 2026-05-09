-- HiveSecretBox Queen Bee consumption migration
-- Idempotent: safe to re-run.
--
-- Adds governance_stamp JSONB to each row-producing table so the QB
-- envelope can be persisted alongside the row that triggered it.
-- The stamp shape mirrors @queen-bee/client GovernanceStamp:
--   { engine, schema, version, timestamp, language, safe, governed, flags }

ALTER TABLE secrets       ADD COLUMN IF NOT EXISTS governance_stamp JSONB;
ALTER TABLE comments      ADD COLUMN IF NOT EXISTS governance_stamp JSONB;
ALTER TABLE monthly_art   ADD COLUMN IF NOT EXISTS governance_stamp JSONB;

CREATE INDEX IF NOT EXISTS idx_secrets_governed
  ON secrets ((governance_stamp->>'governed'))
  WHERE governance_stamp IS NOT NULL;
