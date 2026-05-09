import { headers } from 'next/headers';

type Secret = {
  id: number;
  content: string;
  category: string;
  resonance: number;
  me_too_count: number;
  ai_response?: string;
  image_url?: string | null;
  ai_image_url?: string | null;
  city?: string | null;
  published_at?: string | null;
  created_at: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDrop(date?: string): Promise<{ date: string; secrets: Secret[]; curated: boolean }> {
  const h = await headers();
  const host = h.get('host') || 'secretbox.hive.baby';
  const proto = h.get('x-forwarded-proto') || 'https';
  const url = date
    ? `${proto}://${host}/api/daily?date=${encodeURIComponent(date)}`
    : `${proto}://${host}/api/daily`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { date: date || '', secrets: [], curated: false };
    return await res.json();
  } catch {
    return { date: date || '', secrets: [], curated: false };
  }
}

function fmtDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export default async function DailyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const drop = await getDrop(date);
  const secrets = drop.secrets || [];

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e8e8e8', fontFamily: 'Georgia, serif', maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: '#D4AF37', letterSpacing: 4, marginBottom: 8 }}>✦ DAILY DROP</p>
        <h1 style={{ fontSize: 26, fontWeight: 300, letterSpacing: 3, color: '#D4AF37', margin: 0 }}>five secrets, once a day</h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{fmtDate(drop.date)}</p>
        {!drop.curated && <p style={{ fontSize: 11, color: '#444', marginTop: 12, fontStyle: 'italic' }}>today&apos;s drop arrives at 8pm UTC. these are previewed.</p>}
      </div>

      {secrets.length === 0 && (
        <p style={{ textAlign: 'center', color: '#444', fontSize: 14, marginTop: 48 }}>no drop for this date yet.</p>
      )}

      {secrets.map((s, i) => (
        <article key={s.id} style={{ borderLeft: '2px solid #1a1a1a', padding: '0 0 0 16px', marginBottom: 36 }}>
          {s.ai_image_url && <img src={s.ai_image_url} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', marginBottom: 12, opacity: 0.85 }} />}
          {!s.ai_image_url && s.image_url && <img src={s.image_url} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', marginBottom: 12, opacity: 0.85 }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: '#444', letterSpacing: 2, margin: 0 }}>{s.category.toUpperCase()} · #{i + 1}</p>
            {s.me_too_count > 0 && <p style={{ fontSize: 11, color: '#D4AF37', margin: 0 }}>{s.me_too_count} me too</p>}
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: '#ccc', margin: 0 }}>{s.content}</p>
          {s.city ? (
            <p style={{ fontSize: 11, color: '#555', margin: '8px 0 0 0', fontStyle: 'italic' }}>someone in {s.city}</p>
          ) : (
            <p style={{ fontSize: 11, color: '#444', margin: '8px 0 0 0', fontStyle: 'italic' }}>somewhere in the world</p>
          )}
          {s.ai_response && s.ai_response !== 'You are not alone in this.' && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#c8b8a2', marginTop: 12, fontStyle: 'italic', borderLeft: '1px solid #333', paddingLeft: 12 }}>{s.ai_response}</p>
          )}
        </article>
      ))}

      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 32, borderTop: '1px solid #111' }}>
        <a href="/" style={{ color: '#666', fontSize: 12, letterSpacing: 2, textDecoration: 'none' }}>← BACK TO THE FEED</a>
      </div>
    </main>
  );
}
