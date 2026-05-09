import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';

// GET /api/daily  — today's curated drop (5 secrets).
// Falls back to top-5 by me_too_count from past 24h if no curated drop
// exists yet for today (cron hasn't fired).
//
// GET /api/daily?date=YYYY-MM-DD — historical drop (Plus tier on the UI side).

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const sql = getDb();
    const targetDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);

    const drops = await sql`SELECT secret_ids FROM daily_drops WHERE drop_date = ${targetDate}`;
    if (drops.length) {
      const ids = (drops[0] as { secret_ids: number[] }).secret_ids;
      if (!ids.length) return NextResponse.json({ date: targetDate, secrets: [] });
      const secrets = await sql`
        SELECT id, content, category, resonance, me_too_count,
               ai_response, image_url, ai_image_url, ai_image_generated_at,
               city, scheduled_release_at, published_at, created_at
          FROM secrets
          WHERE id = ANY(${ids})
            AND published_at IS NOT NULL
          ORDER BY array_position(${ids}::int[], id)
      `;
      return NextResponse.json(assertNoIdentity({ date: targetDate, secrets, curated: true }));
    }

    if (date) return NextResponse.json({ date: targetDate, secrets: [], curated: false });

    const fallback = await sql`
      SELECT id, content, category, resonance, me_too_count,
             ai_response, image_url, ai_image_url, ai_image_generated_at,
             city, scheduled_release_at, published_at, created_at
        FROM secrets
        WHERE published_at IS NOT NULL
          AND published_at > NOW() - INTERVAL '24 hours'
        ORDER BY me_too_count DESC, resonance DESC, published_at DESC
        LIMIT 5
    `;
    return NextResponse.json(assertNoIdentity({ date: targetDate, secrets: fallback, curated: false }));
  } catch {
    return NextResponse.json({ secrets: [] });
  }
}
