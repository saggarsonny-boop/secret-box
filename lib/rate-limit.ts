import { getDb } from './db';

export type Tier = 'free' | 'plus' | 'pro';
export type Bucket = 'secrets_24h' | 'comments_60m' | 'ai_image_24h';

const LIMITS: Record<Bucket, Record<Tier, { max: number; windowSec: number }>> = {
  secrets_24h: {
    free: { max: 3, windowSec: 86400 },
    plus: { max: 10, windowSec: 86400 },
    pro: { max: 1_000_000, windowSec: 86400 }
  },
  comments_60m: {
    free: { max: 5, windowSec: 3600 },
    plus: { max: 5, windowSec: 3600 },
    pro: { max: 5, windowSec: 3600 }
  },
  ai_image_24h: {
    free: { max: 1, windowSec: 86400 },
    plus: { max: 1_000_000, windowSec: 86400 },
    pro: { max: 1_000_000, windowSec: 86400 }
  }
};

export async function checkAndIncrement(token: string, bucket: Bucket, tier: Tier): Promise<{ ok: boolean; remaining: number; resetSec: number }> {
  const cfg = LIMITS[bucket][tier];
  const sql = getDb();
  const rows = await sql`
    INSERT INTO rate_limits (session_token, bucket, count, window_start)
    VALUES (${token}, ${bucket}, 1, NOW())
    ON CONFLICT (session_token, bucket) DO UPDATE
      SET count = CASE
        WHEN rate_limits.window_start < NOW() - (${cfg.windowSec} || ' seconds')::interval THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < NOW() - (${cfg.windowSec} || ' seconds')::interval THEN NOW()
        ELSE rate_limits.window_start
      END
    RETURNING count, EXTRACT(EPOCH FROM (NOW() - window_start))::int AS elapsed
  `;
  const r = rows[0] as { count: number; elapsed: number };
  if (r.count > cfg.max) {
    return { ok: false, remaining: 0, resetSec: Math.max(0, cfg.windowSec - r.elapsed) };
  }
  return { ok: true, remaining: cfg.max - r.count, resetSec: Math.max(0, cfg.windowSec - r.elapsed) };
}
