import { cookies } from 'next/headers';
import type { Tier } from './rate-limit';

// HMAC SHA-256 using standard Web Crypto API
async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    messageData
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getTier(): Promise<Tier> {
  try {
    const jar = await cookies();
    const cookieVal = jar.get('hive_tier')?.value;
    if (!cookieVal) return 'free';

    const secret = process.env.PLUS_AUTH_SECRET;
    if (!secret) {
      if (cookieVal === 'pro') return 'pro';
      if (cookieVal === 'plus') return 'plus';
      return 'free';
    }

    const [payloadBase64, signature] = cookieVal.split('.');
    if (!payloadBase64 || !signature) return 'free';

    // Verify signature using async Web Crypto
    const expectedSig = await hmacSha256(secret, payloadBase64);

    if (signature !== expectedSig) return 'free';

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    
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

export async function signTierCookie(tier: Tier, expiresAt?: number): Promise<string> {
  const secret = process.env.PLUS_AUTH_SECRET;
  if (!secret) {
    throw new Error('PLUS_AUTH_SECRET is not set');
  }

  const payload = {
    tier,
    expiresAt: expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = await hmacSha256(secret, payloadBase64);

  return `${payloadBase64}.${signature}`;
}
