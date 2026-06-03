import { cookies } from 'next/headers';
import type { Tier } from './rate-limit';
import crypto from 'crypto';

// Stripe-managed tier signal stored as a signed cookie.
// PLUS_AUTH_SECRET signs the cookie as: base64(payload).signature

export async function getTier(): Promise<Tier> {
  try {
    const jar = await cookies();
    const cookieVal = jar.get('hive_tier')?.value;
    if (!cookieVal) return 'free';

    const secret = process.env.PLUS_AUTH_SECRET;
    if (!secret) {
      // Fallback for dev mode / testing if secret is not set
      if (cookieVal === 'pro') return 'pro';
      if (cookieVal === 'plus') return 'plus';
      return 'free';
    }

    const [payloadBase64, signature] = cookieVal.split('.');
    if (!payloadBase64 || !signature) return 'free';

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('hex');

    if (signature !== expectedSig) return 'free';

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    
    // Check expiration (timestamp comparison)
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return 'free';
    }

    if (payload.tier === 'pro') return 'pro';
    if (payload.tier === 'plus') return 'plus';
  } catch (e) {
    console.error('Error parsing tier cookie:', e);
    return 'free';
  }

  return 'free';
}

export function signTierCookie(tier: Tier, expiresAt?: number): string {
  const secret = process.env.PLUS_AUTH_SECRET;
  if (!secret) {
    throw new Error('PLUS_AUTH_SECRET is not set');
  }

  const payload = {
    tier,
    expiresAt: expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('hex');

  return `${payloadBase64}.${signature}`;
}
