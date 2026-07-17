export const runtime = 'edge';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';
import { govern } from '@/lib/governance';

// GET /api/daily  — today's curated drop (5 secrets).
// Falls back to top-5 by me_too_count from past 24h if no curated drop
// exists yet for today (cron hasn't fired).
//
// GET /api/daily?date=YYYY-MM-DD — historical drop (Plus tier on the UI side).

type SecretRow = {
  id: number; resonance: number; me_too_count: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const sql = getDb();
    const targetDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);

    const drops = await sql`SELECT secret_ids FROM daily_drops WHERE drop_date = ${targetDate}`;
    let secrets: unknown[] = [];
    let curated = false;
    if (drops.length) {
      const ids = (drops[0] as { secret_ids: number[] }).secret_ids;
      if (ids.length) {
        secrets = await sql`
          SELECT id, content, category, resonance, me_too_count,
                 ai_response, image_url, ai_image_url, ai_image_generated_at,
                 city, scheduled_release_at, published_at, created_at
            FROM secrets
            WHERE id = ANY(${ids})
              AND published_at IS NOT NULL
            ORDER BY array_position(${ids}::int[], id)
        `;
        curated = true;
      }
    } else if (!date) {
      secrets = await sql`
        SELECT id, content, category, resonance, me_too_count,
               ai_response, image_url, ai_image_url, ai_image_generated_at,
               city, scheduled_release_at, published_at, created_at
          FROM secrets
          WHERE published_at IS NOT NULL
            AND published_at > NOW() - INTERVAL '24 hours'
          ORDER BY me_too_count DESC, resonance DESC, published_at DESC
          LIMIT 5
      `;
    }

    // Queen Bee — schema = secret-response from registry. The drop's
    // collective resonance is the sum of me_too_count across the
    // drop, which matches the schema's resonance field semantics.
    const totalResonance = (secrets as SecretRow[]).reduce((s, r) => s + (r.me_too_count ?? 0) + (r.resonance ?? 0), 0);
    const verdict = await govern({
      input: `daily-drop:${targetDate}`,
      content: { received: true, resonance: totalResonance },
      context: { locale: req.headers.get('accept-language') ?? undefined },
    });
    const stamp = verdict.approved ? verdict.stamp : undefined;

    return NextResponse.json({
      ...assertNoIdentity({ date: targetDate, secrets, curated }),
      _governance: stamp,
    });
  } catch {
    return NextResponse.json({ secrets: [] });
  }
}
