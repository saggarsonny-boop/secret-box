import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = getDb();
    // Use day of year as seed for consistent daily selection
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const secrets = await sql`SELECT * FROM secrets ORDER BY resonance DESC LIMIT 20`;
    if (secrets.length === 0) return NextResponse.json(null);
    const secret = secrets[dayOfYear % secrets.length];
    return NextResponse.json(secret);
  } catch {
    return NextResponse.json(null);
  }
}
