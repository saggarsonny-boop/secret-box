export const runtime = 'edge';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';

export async function GET() {
  try {
    const sql = getDb();
    const result = await sql`
      SELECT id, content, category, resonance, me_too_count,
             ai_response, image_url, ai_image_url, ai_image_generated_at,
             city, scheduled_release_at, published_at, created_at
        FROM secrets
        WHERE published_at IS NOT NULL
        ORDER BY resonance DESC
        LIMIT 1
    `;
    return NextResponse.json(assertNoIdentity(result[0] || null));
  } catch {
    return NextResponse.json(null);
  }
}
