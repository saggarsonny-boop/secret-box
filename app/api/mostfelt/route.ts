import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = getDb();
    const result = await sql`SELECT * FROM secrets ORDER BY resonance DESC LIMIT 1`;
    return NextResponse.json(result[0] || null);
  } catch {
    return NextResponse.json(null);
  }
}
