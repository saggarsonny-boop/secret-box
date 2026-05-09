import { cookies } from 'next/headers';
import type { Tier } from './rate-limit';

// Stripe-managed tier signal stored as a signed cookie. Until a Plus
// signup flow exists in the engine, `getTier` always returns 'free'.
// The cookie name is forward-compatible with the rest of the Hive
// (PLUS_AUTH_SECRET signs `hive_tier`).

export async function getTier(): Promise<Tier> {
  const jar = await cookies();
  const v = jar.get('hive_tier')?.value;
  if (v === 'pro') return 'pro';
  if (v === 'plus') return 'plus';
  return 'free';
}
