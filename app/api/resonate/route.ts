import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const sql = getDb();
    const result = await sql`UPDATE secrets SET resonance = resonance + 1 WHERE id = ${id} RETURNING *`;
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
