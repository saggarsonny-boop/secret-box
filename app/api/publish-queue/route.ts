import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/publish-queue — releases time-released secrets whose
// scheduled_release_at has passed. Auth via CRON_SECRET. Runs every 5min
// from .github/workflows/secret-box-publish-queue.yml.

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const sql = getDb();
    const released = await sql`
      UPDATE secrets
        SET published_at = NOW()
        WHERE scheduled_release_at IS NOT NULL
          AND scheduled_release_at <= NOW()
          AND published_at IS NULL
        RETURNING id
    ` as { id: number }[];
    return NextResponse.json({ released: released.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'failed', detail: String(e) }, { status: 500 });
  }
}
