export const runtime = 'edge';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/daily/curate  — picks today's 5-secret drop.
// Auth: shared secret in `Authorization: Bearer <CRON_SECRET>` header.
// Selection: top by me_too_count from past 24h, with a per-mood diversity
// filter (max 1 per category).

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const sql = getDb();
    const candidates = await sql`
      SELECT id, category, me_too_count, resonance
        FROM secrets
        WHERE published_at IS NOT NULL
          AND published_at > NOW() - INTERVAL '24 hours'
        ORDER BY me_too_count DESC, resonance DESC, published_at DESC
        LIMIT 100
    ` as { id: number; category: string; me_too_count: number; resonance: number }[];

    const picked: number[] = [];
    const seenCategories = new Set<string>();
    for (const c of candidates) {
      if (picked.length >= 5) break;
      if (seenCategories.has(c.category)) continue;
      picked.push(c.id);
      seenCategories.add(c.category);
    }
    // Top up if diversity filter underfilled.
    if (picked.length < 5) {
      for (const c of candidates) {
        if (picked.length >= 5) break;
        if (!picked.includes(c.id)) picked.push(c.id);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    await sql`
      INSERT INTO daily_drops (drop_date, secret_ids)
      VALUES (${today}, ${picked})
      ON CONFLICT (drop_date) DO UPDATE SET secret_ids = EXCLUDED.secret_ids
    `;
    return NextResponse.json({ date: today, picked });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'failed', detail: String(e) }, { status: 500 });
  }
}
