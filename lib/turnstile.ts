// Cloudflare Turnstile verification with graceful degradation.
// If TURNSTILE_SECRET_KEY is unset, allows the request through and returns
// `{ ok: true, mode: 'degraded' }` so the upstream rate-limiter still applies.

type Result = { ok: true; mode: 'verified' | 'degraded' } | { ok: false; reason: string };

export async function verifyTurnstile(token: string | undefined | null, ip: string | null): Promise<Result> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, mode: 'degraded' };
  if (!token) return { ok: false, reason: 'missing_token' };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body
    });
    const data = await res.json() as { success: boolean; 'error-codes'?: string[] };
    if (data.success) return { ok: true, mode: 'verified' };
    return { ok: false, reason: (data['error-codes'] || ['unknown']).join(',') };
  } catch {
    return { ok: true, mode: 'degraded' };
  }
}
