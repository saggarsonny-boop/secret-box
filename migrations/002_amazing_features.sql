-- HiveSecretBox amazing features migration
-- Idempotent: safe to re-run.

-- Feature 1: recognition by similarity — emotional theme classification.
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS theme TEXT;
CREATE INDEX IF NOT EXISTS idx_secrets_theme ON secrets (theme) WHERE theme IS NOT NULL;

-- Feature 2: public art mode — monthly poster gallery.
-- posters is an array of { secret_id, url, alt_text } objects.
CREATE TABLE IF NOT EXISTS monthly_art (
  drop_month DATE PRIMARY KEY,
  posters JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
