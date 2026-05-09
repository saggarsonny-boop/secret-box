// Anonymity defense-in-depth.
//
// First line of defense: every route that reads from a table holding
// identity-linking columns (currently `secrets.session_token`, future-
// proofed against `ip_hash`, raw IP, or any per-user correlator)
// projects explicit columns at the SQL layer. PUBLIC_SECRET_COLUMNS and
// PUBLIC_COMMENT_COLUMNS are the canonical lists.
//
// Second line of defense: every API response runs through assertNoIdentity
// before NextResponse.json. It walks the response and strips any key whose
// name matches the identity blocklist, regardless of where it originated.
// If a future migration adds a new identity column and a developer forgets
// to update the projection, this scrubber still catches it before the
// payload leaves the server.

const IDENTITY_KEYS = new Set([
  'session_token',
  'ip_hash',
  'ip',
  'remote_ip',
  'remote_addr',
  'user_id',
  'fingerprint',
  'device_id',
]);

export const PUBLIC_SECRET_COLUMNS = [
  'id', 'content', 'category', 'resonance',
  'me_too_count', 'ai_response', 'image_url',
  'ai_image_url', 'ai_image_generated_at',
  'city', 'scheduled_release_at', 'published_at',
  'created_at',
] as const;

export const PUBLIC_COMMENT_COLUMNS = [
  'id', 'secret_id', 'content', 'created_at',
] as const;

// Recursively walks the value and removes any property whose key is in
// IDENTITY_KEYS. Mutates objects in place; returns the same reference for
// fluent use. Arrays are walked element-by-element. Primitives pass
// through. Cycles are short-circuited via a WeakSet.

export function assertNoIdentity<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || typeof value !== 'object') return value;
  const obj = value as unknown as object;
  if (seen.has(obj)) return value;
  seen.add(obj);
  if (Array.isArray(value)) {
    for (const item of value) assertNoIdentity(item, seen);
    return value;
  }
  for (const key of Object.keys(obj)) {
    if (IDENTITY_KEYS.has(key)) {
      delete (obj as Record<string, unknown>)[key];
      continue;
    }
    assertNoIdentity((obj as Record<string, unknown>)[key], seen);
  }
  return value;
}
