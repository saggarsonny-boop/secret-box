// City-level geolocation from request headers.
// Cloudflare adds `cf-ipcity` and `cf-ipcountry` to every request when proxied.
// We never store the IP itself — only the city string (or null).

export function cityFromHeaders(h: Headers): string | null {
  const city = h.get('cf-ipcity');
  if (!city || city === 'XX' || city.length < 2) return null;
  // Cloudflare URL-encodes spaces as `+`.
  const decoded = city.replace(/\+/g, ' ');
  return decoded.slice(0, 80);
}

export function ipFromHeaders(h: Headers): string | null {
  // Used only for Turnstile siteverify and immediately discarded — never stored.
  return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}
