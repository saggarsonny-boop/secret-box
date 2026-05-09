import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE = 'sb_session';
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOrCreateSessionToken(): Promise<{ token: string; isNew: boolean }> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[a-f0-9]{32,64}$/.test(existing)) return { token: existing, isNew: false };
  const token = crypto.randomBytes(24).toString('hex');
  jar.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: ONE_YEAR, path: '/' });
  return { token, isNew: true };
}

export async function getSessionTokenIfPresent(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return v && /^[a-f0-9]{32,64}$/.test(v) ? v : null;
}
