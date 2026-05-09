import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';

// GET /api/monthly-art?month=YYYY-MM
// Returns the curated 12-secret poster gallery for that month.
// Empty list when the curate cron hasn't run yet.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ month: null, posters: [] });
    const sql = getDb();
    const rows = await sql`
      SELECT drop_month, posters, generated_at
        FROM monthly_art
        WHERE drop_month = ${month + '-01'}
    `;
    if (!rows.length) return NextResponse.json({ month, posters: [] });
    const row = rows[0] as { drop_month: string; posters: unknown[]; generated_at: string };
    return NextResponse.json(assertNoIdentity({
      month,
      generated_at: row.generated_at,
      posters: row.posters
    }));
  } catch {
    return NextResponse.json({ month: null, posters: [] });
  }
}
