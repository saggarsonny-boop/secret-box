export const runtime = 'edge';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';
import { getTier } from '@/lib/tier';

// GET /api/similar?secret_id=N
// Returns 1 (free) or 3 (plus/pro) other published secrets sharing the
// same emotional theme as the seed, ordered by me_too_count desc with
// random tie-breaking. Excludes the seed itself.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('secret_id'));
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json([]);

    const tier = await getTier();
    const limit = tier === 'free' ? 1 : 3;

    const sql = getDb();
    const seedRows = await sql`SELECT theme FROM secrets WHERE id = ${id}` as { theme: string | null }[];
    if (!seedRows.length) return NextResponse.json([]);
    const theme = seedRows[0].theme;
    if (!theme) return NextResponse.json([]);

    const rows = await sql`
      SELECT id, content, category, resonance, me_too_count,
             ai_response, image_url, ai_image_url, ai_image_generated_at,
             city, scheduled_release_at, published_at, created_at
        FROM secrets
        WHERE theme = ${theme}
          AND published_at IS NOT NULL
          AND id <> ${id}
        ORDER BY me_too_count DESC, random()
        LIMIT ${limit}
    `;
    return NextResponse.json(assertNoIdentity(rows));
  } catch {
    return NextResponse.json([]);
  }
}
