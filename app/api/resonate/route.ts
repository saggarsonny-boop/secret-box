import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const sql = getDb();
    const result = await sql`
      UPDATE secrets
        SET resonance = resonance + 1
        WHERE id = ${id}
        RETURNING id, content, category, resonance, me_too_count,
                  ai_response, image_url, ai_image_url, ai_image_generated_at,
                  city, scheduled_release_at, published_at, created_at
    `;
    return NextResponse.json(assertNoIdentity(result[0]));
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
