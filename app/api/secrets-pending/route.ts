export const runtime = 'edge';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSessionTokenIfPresent } from '@/lib/session';
import { assertNoIdentity } from '@/lib/safety';

// GET /api/secrets-pending  — returns this session's queued (time-released)
// secrets. Empty list when there's no session cookie.
//
// DELETE /api/secrets-pending  body: { id }  — cancels a queued secret iff
// it belongs to this session and hasn't published yet.

export async function GET() {
  const token = await getSessionTokenIfPresent();
  if (!token) return NextResponse.json([]);
  const sql = getDb();
  const rows = await sql`
    SELECT id, content, category, scheduled_release_at, created_at
      FROM secrets
      WHERE session_token = ${token}
        AND scheduled_release_at IS NOT NULL
        AND published_at IS NULL
      ORDER BY scheduled_release_at ASC
  `;
  return NextResponse.json(assertNoIdentity(rows));
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
    const token = await getSessionTokenIfPresent();
    if (!token) return NextResponse.json({ error: 'no_session' }, { status: 401 });
    const sql = getDb();
    const rows = await sql`
      DELETE FROM secrets
        WHERE id = ${id}
          AND session_token = ${token}
          AND published_at IS NULL
        RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ error: 'not_found_or_published' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
