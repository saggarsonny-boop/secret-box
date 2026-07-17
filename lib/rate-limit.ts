import { getDb } from './db';
// HMAC SHA-256 helper for Rate Limit using Web Crypto
async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  const key = await globalThis.crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, messageData);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}



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

export async function checkAndIncrement(
  token: string,
  bucket: Bucket,
  tier: Tier,
  ip?: string | null
): Promise<{ ok: boolean; remaining: number; resetSec: number }> {
  const cfg = LIMITS[bucket][tier];
  const sql = getDb();
  
  // 1. Check & increment session token limit
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

  let ipOk = true;
  let ipRemaining = cfg.max;
  let ipResetSec = 0;

  // 2. Dual check: if IP is provided, check & increment IP-based limit (using hashed IP as session_token)
  if (ip) {
    const salt = process.env.PLUS_AUTH_SECRET || 'secretbox_fallback_salt';
    const ipHash = await hmacSha256(salt, ip);
    const ipRows = await sql`
      INSERT INTO rate_limits (session_token, bucket, count, window_start)
      VALUES (${ipHash}, ${bucket}, 1, NOW())
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
    const ipR = ipRows[0] as { count: number; elapsed: number };
    if (ipR.count > cfg.max) {
      ipOk = false;
      ipRemaining = 0;
      ipResetSec = Math.max(0, cfg.windowSec - ipR.elapsed);
    } else {
      ipRemaining = cfg.max - ipR.count;
      ipResetSec = Math.max(0, cfg.windowSec - ipR.elapsed);
    }
  }
  
  if (r.count > cfg.max) {
    return { ok: false, remaining: 0, resetSec: Math.max(0, cfg.windowSec - r.elapsed) };
  }
  if (!ipOk) {
    return { ok: false, remaining: 0, resetSec: ipResetSec };
  }
  return { ok: true, remaining: Math.min(cfg.max - r.count, ipRemaining), resetSec: Math.max(0, cfg.windowSec - r.elapsed) };
}
