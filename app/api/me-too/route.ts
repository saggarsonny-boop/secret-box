import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/me-too — atomic increment of recognition count.
// Idempotency lives client-side in localStorage so anonymity is preserved
// (no per-user tracking server-side; double-tap protection is best-effort).

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
    const sql = getDb();
    const result = await sql`
      UPDATE secrets
        SET me_too_count = me_too_count + 1,
            resonance = resonance + 1
        WHERE id = ${id}
        RETURNING id, me_too_count, resonance
    `;
    if (!result.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
