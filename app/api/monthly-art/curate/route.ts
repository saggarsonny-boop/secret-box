import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateSecretImage, moodToImagePrompt } from '@/lib/replicate';

// POST /api/monthly-art/curate
// Auth: Bearer ${CRON_SECRET}.
// Selects top 12 secrets from the previous month by me_too_count,
// generates poster art for each via Replicate FLUX (re-using the
// existing mood-keyed prompt builder), and stores the gallery in
// monthly_art keyed by the previous month's first day.
//
// Idempotent at the row level via UPSERT — re-running for a given
// month overwrites the gallery.

type Pick = {
  id: number;
  content: string;
  category: string;
  me_too_count: number;
  resonance: number;
  city: string | null;
  ai_image_url: string | null;
};

function previousMonthFirstDay(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const sql = getDb();
    const month = previousMonthFirstDay();
    const candidates = await sql`
      SELECT id, content, category, me_too_count, resonance, city, ai_image_url
        FROM secrets
        WHERE published_at IS NOT NULL
          AND published_at >= ${month}::date
          AND published_at < (${month}::date + INTERVAL '1 month')
        ORDER BY me_too_count DESC, resonance DESC, published_at DESC
        LIMIT 12
    ` as Pick[];

    if (!candidates.length) {
      await sql`
        INSERT INTO monthly_art (drop_month, posters, generated_at)
        VALUES (${month}, ${JSON.stringify([])}::jsonb, NOW())
        ON CONFLICT (drop_month) DO UPDATE SET posters = EXCLUDED.posters, generated_at = NOW()
      `;
      return NextResponse.json({ month, picked: 0, generated: 0 });
    }

    const posters = await Promise.all(candidates.map(async c => {
      let url = c.ai_image_url;
      if (!url) {
        try {
          url = await generateSecretImage(moodToImagePrompt(c.content, c.category));
        } catch {
          url = null;
        }
      }
      return {
        secret_id: c.id,
        content: c.content,
        category: c.category,
        me_too_count: c.me_too_count,
        city: c.city,
        url
      };
    }));

    await sql`
      INSERT INTO monthly_art (drop_month, posters, generated_at)
      VALUES (${month}, ${JSON.stringify(posters)}::jsonb, NOW())
      ON CONFLICT (drop_month) DO UPDATE SET posters = EXCLUDED.posters, generated_at = NOW()
    `;
    return NextResponse.json({
      month,
      picked: candidates.length,
      generated: posters.filter(p => p.url).length
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'failed', detail: String(e) }, { status: 500 });
  }
}
