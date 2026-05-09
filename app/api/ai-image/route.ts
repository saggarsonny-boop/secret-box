import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getOrCreateSessionToken } from '@/lib/session';
import { checkAndIncrement } from '@/lib/rate-limit';
import { getTier } from '@/lib/tier';
import { generateSecretImage, moodToImagePrompt } from '@/lib/replicate';

// POST /api/ai-image  body: { id }
// Generates a Replicate FLUX schnell image for the given secret if it
// doesn't have one yet. Free tier: 1 generation per session per 24h.
// Plus tier: effectively unlimited. Pro tier: unlimited.
//
// REPLICATE_API_TOKEN gap: when the env var is unset, generateSecretImage
// returns null and we record nothing — the secret stays text-only.

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

    const sql = getDb();
    const rows = await sql`SELECT id, content, category, ai_image_url FROM secrets WHERE id = ${id}`;
    if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const secret = rows[0] as { id: number; content: string; category: string; ai_image_url: string | null };
    if (secret.ai_image_url) return NextResponse.json({ ai_image_url: secret.ai_image_url, cached: true });

    const { token } = await getOrCreateSessionToken();
    const tier = await getTier();
    const limit = await checkAndIncrement(token, 'ai_image_24h', tier);
    if (!limit.ok) {
      return NextResponse.json({ error: 'rate_limited', resetSec: limit.resetSec }, { status: 429 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'service_unavailable', detail: 'replicate_token_not_provisioned' }, { status: 503 });
    }

    const prompt = moodToImagePrompt(secret.content, secret.category);
    const url = await generateSecretImage(prompt);
    if (!url) return NextResponse.json({ error: 'generation_failed' }, { status: 502 });

    await sql`UPDATE secrets SET ai_image_url = ${url}, ai_image_generated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ai_image_url: url });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
