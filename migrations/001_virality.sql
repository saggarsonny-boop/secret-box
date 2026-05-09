-- HiveSecretBox virality migration
-- Idempotent: safe to re-run.

ALTER TABLE secrets ADD COLUMN IF NOT EXISTS me_too_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS ai_image_url TEXT;
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS ai_image_generated_at TIMESTAMPTZ;
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS scheduled_release_at TIMESTAMPTZ;
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS session_token TEXT;

CREATE INDEX IF NOT EXISTS idx_secrets_published_at ON secrets (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_secrets_scheduled_release_at ON secrets (scheduled_release_at) WHERE scheduled_release_at IS NOT NULL AND published_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_secrets_session_token ON secrets (session_token) WHERE session_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS rate_limits (
  session_token TEXT NOT NULL,
  bucket TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_token, bucket)
);

CREATE TABLE IF NOT EXISTS cost_ledger (
  day DATE NOT NULL,
  vendor TEXT NOT NULL,
  cents INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, vendor)
);

CREATE TABLE IF NOT EXISTS daily_drops (
  drop_date DATE PRIMARY KEY,
  secret_ids INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE secrets SET published_at = created_at WHERE published_at IS NULL AND scheduled_release_at IS NULL;
