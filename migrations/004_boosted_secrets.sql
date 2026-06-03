-- HiveSecretBox boosted secrets migration
-- Idempotent: safe to re-run.

ALTER TABLE secrets ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_secrets_boosted_until ON secrets (boosted_until) WHERE boosted_until IS NOT NULL;
