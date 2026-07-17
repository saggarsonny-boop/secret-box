import { cookies } from 'next/headers';

const COOKIE = 'sb_session';
const ONE_YEAR = 60 * 60 * 24 * 365;

function generateRandomHex(bytesLength: number): string {
  const arr = new Uint8Array(bytesLength);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getOrCreateSessionToken(): Promise<{ token: string; isNew: boolean }> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[a-f0-9]{32,64}$/.test(existing)) return { token: existing, isNew: false };
  const token = generateRandomHex(24);
  jar.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: ONE_YEAR, path: '/' });
  return { token, isNew: true };
}

export async function getSessionTokenIfPresent(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return v && /^[a-f0-9]{32,64}$/.test(v) ? v : null;
}
