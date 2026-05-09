import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';

type Poster = {
  secret_id: number;
  content: string;
  category: string;
  me_too_count: number;
  city: string | null;
  url: string | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGallery(month: string): Promise<{ month: string | null; posters: Poster[]; generated_at?: string }> {
  const h = await headers();
  const host = h.get('host') || 'secretbox.hive.baby';
  const proto = h.get('x-forwarded-proto') || 'https';
  try {
    const res = await fetch(`${proto}://${host}/api/monthly-art?month=${encodeURIComponent(month)}`, { cache: 'no-store' });
    if (!res.ok) return { month, posters: [] };
    return await res.json();
  } catch {
    return { month, posters: [] };
  }
}

function fmtMonth(m: string): string {
  if (!/^\d{4}-\d{2}$/.test(m)) return m;
  return new Date(m + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  const title = `HiveSecretBox — public art ${fmtMonth(month)}`;
  return {
    title,
    description: `Twelve most-resonated secrets of ${fmtMonth(month)}, rendered as anonymous public art.`,
    openGraph: {
      title,
      description: 'Anonymous public art — secretbox.hive.baby',
      images: [{ url: '/og.png', width: 1200, height: 630 }]
    }
  };
}

export default async function ArtMonthPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const data = await getGallery(month);

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e8e8e8', fontFamily: 'Georgia, serif', padding: '24px 16px', maxWidth: 1080, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: '#D4AF37', letterSpacing: 4, marginBottom: 8 }}>✦ PUBLIC ART</p>
        <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 4, color: '#D4AF37', margin: 0 }}>{fmtMonth(month)}</h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>twelve most-felt secrets of the month, rendered as anonymous public art</p>
      </header>

      {data.posters.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#444', fontSize: 14, marginTop: 48 }}>
          art for this month hasn&apos;t been curated yet. it lands on the 1st at 12:00 UTC.
        </p>
      ) : (
        <GalleryClient month={month} posters={data.posters} />
      )}

      <div style={{ textAlign: 'center', marginTop: 64, paddingTop: 32, borderTop: '1px solid #111' }}>
        <p style={{ fontSize: 11, color: '#444', letterSpacing: 1, marginBottom: 8 }}>secretbox.hive.baby — anonymous, public, free</p>
        <a href="/" style={{ color: '#666', fontSize: 12, letterSpacing: 2, textDecoration: 'none' }}>← BACK TO THE FEED</a>
      </div>
    </main>
  );
}
