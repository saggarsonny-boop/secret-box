-- HiveSecretBox traffic and conversion tracking migration
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS traffic_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_bot BOOLEAN NOT NULL,
  user_agent TEXT,
  action TEXT NOT NULL, -- 'page_view', 'checkout_started', 'checkout_completed'
  plan TEXT, -- 'plus', 'pro', 'boost'
  conversion_value_cents INTEGER DEFAULT 0
);
