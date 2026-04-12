import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = getDb();
    const result = await sql`
      SELECT * FROM secrets 
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY resonance DESC 
      LIMIT 1
    `;
    if (result.length === 0) {
      const fallback = await sql`SELECT * FROM secrets ORDER BY resonance DESC LIMIT 1`;
      return NextResponse.json(fallback[0] || null);
    }
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json(null);
  }
}
