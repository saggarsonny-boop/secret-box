export const runtime = 'edge';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { assertNoIdentity } from '@/lib/safety';

export async function GET() {
  try {
    const sql = getDb();
    // Use day of year as seed for consistent daily selection
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const secrets = await sql`
      SELECT id, content, category, resonance, me_too_count,
             ai_response, image_url, ai_image_url, ai_image_generated_at,
             city, scheduled_release_at, published_at, created_at
        FROM secrets
        WHERE published_at IS NOT NULL
        ORDER BY resonance DESC
        LIMIT 20
    `;
    if (secrets.length === 0) return NextResponse.json(null);
    const secret = secrets[dayOfYear % secrets.length];
    return NextResponse.json(assertNoIdentity(secret));
  } catch {
    return NextResponse.json(null);
  }
}
