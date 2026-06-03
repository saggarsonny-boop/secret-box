import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getOrCreateSessionToken } from '@/lib/session';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkAndIncrement } from '@/lib/rate-limit';
import { isOverCap, recordSpend, estimateAnthropicCents } from '@/lib/cost-cap';
import { cityFromHeaders, ipFromHeaders } from '@/lib/geo';
import { getTier } from '@/lib/tier';
import { assertNoIdentity } from '@/lib/safety';
import { classifyTheme } from '@/lib/theme';
import { govern } from '@/lib/governance';

function containsPersonalInfo(text: string): boolean {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?)(\d{3}[\s.-]?\d{4})/;
  const namePatterns = /my name is|i am called|i'm called|call me/i;
  return emailRegex.test(text) || phoneRegex.test(text) || namePatterns.test(text);
}

function localSafetyCheck(text: string): boolean {
  // Simple check for extreme words to reject instantly without API latency or cost
  const forbidden = /\b(suicide|kill myself|end my life|slit my wrist|hang myself|shoot myself|self harm|slits? my wrists?)\b/i;
  return !forbidden.test(text);
}

async function getAIResponseAndModeration(content: string): Promise<{ safe: boolean; response: string }> {
  const fallback = { safe: true, response: 'You are not alone in this.' };
  if (await isOverCap('anthropic')) return fallback;
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return fallback;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are a moderator and companion for an anonymous confession website.
Analyze this secret: "${content}"

Determine if it violates safety rules:
1. Extremely unsafe, promoting self-harm or suicide.
2. Graphic violence or severe targeted harassment/abuse.
3. Illegal activities.

If it violates safety, reply EXACTLY with:
STATUS: UNSAFE

If it is safe, reply EXACTLY in this format:
STATUS: SAFE
RESPONSE: <write a single short, warm, human response (2-3 sentences max) that makes them feel less alone. No advice. Just compassion. Respond in the same language as the secret.>`
        }]
      })
    });
    const data = await response.json() as { content?: { text: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    if (data.usage) {
      await recordSpend(estimateAnthropicCents(data.usage.input_tokens, data.usage.output_tokens));
    }
    const text = data.content && data.content[0] ? data.content[0].text.trim() : '';
    if (text.startsWith('STATUS: UNSAFE')) {
      return { safe: false, response: '' };
    }
    if (text.startsWith('STATUS: SAFE')) {
      const match = text.match(/RESPONSE:\s*([\s\S]+)$/i);
      const resVal = match ? match[1].trim() : 'You are not alone in this.';
      return { safe: true, response: resVal };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const sql = getDb();
    const secrets = await sql`
      SELECT id, content, category, resonance, me_too_count,
             ai_response, image_url, ai_image_url, ai_image_generated_at,
             city, scheduled_release_at, published_at, boosted_until, created_at
        FROM secrets
        WHERE published_at IS NOT NULL
        ORDER BY (boosted_until IS NOT NULL AND boosted_until > NOW()) DESC, published_at DESC
        LIMIT 50
    `;
    return NextResponse.json(assertNoIdentity(secrets));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, category, image_url, turnstile_token, share_city, schedule } = body as {
      content?: string;
      category?: string;
      image_url?: string | null;
      turnstile_token?: string;
      share_city?: boolean;
      schedule?: 'now' | '24h' | '7d';
    };

    if (!content || content.length < 5) return NextResponse.json({ error: 'Too short' }, { status: 400 });
    if (containsPersonalInfo(content)) return NextResponse.json({ error: 'personal_info' }, { status: 400 });
    
    // First line of defense: check local safety filter for self-harm / suicide phrases
    if (!localSafetyCheck(content)) {
      return NextResponse.json({ error: 'self_harm_detected', detail: 'If you are experiencing thoughts of self-harm, please reach out to a support helpline.' }, { status: 422 });
    }

    const ip = ipFromHeaders(req.headers);
    const ts = await verifyTurnstile(turnstile_token, ip);
    if (!ts.ok) return NextResponse.json({ error: 'captcha_failed' }, { status: 400 });

    const { token } = await getOrCreateSessionToken();
    const tier = await getTier();
    
    // Apply dual cookie + hashed IP rate limiting
    const limit = await checkAndIncrement(token, 'secrets_24h', tier, ip);
    if (!limit.ok) {
      return NextResponse.json({ error: 'rate_limited', resetSec: limit.resetSec }, { status: 429 });
    }

    // Call LLM for combined companion response and moderation
    const modResult = await getAIResponseAndModeration(content);
    if (!modResult.safe) {
      return NextResponse.json({ error: 'content_moderation_failed' }, { status: 422 });
    }
    const ai_response = modResult.response;

    const city = share_city === false ? null : cityFromHeaders(req.headers);

    const now = new Date();
    let scheduledRelease: Date | null = null;
    let publishedAt: Date | null = now;
    if (schedule === '24h') {
      scheduledRelease = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      publishedAt = null;
    } else if (schedule === '7d') {
      scheduledRelease = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      publishedAt = null;
    }

    const theme = await classifyTheme(content);

    // Queen Bee — validate the structured output before storage.
    const verdict = await govern({
      input: content,
      content: { received: true, resonance: 0 },
      context: { tier, locale: req.headers.get('accept-language') ?? undefined, sessionId: token },
    });
    if (!verdict.approved) {
      return NextResponse.json({ error: 'governance_rejected', failureCode: verdict.failureCode }, { status: 422 });
    }
    const stamp = verdict.stamp;

    const sql = getDb();
    const result = await sql`
      INSERT INTO secrets (
        content, category, resonance, ai_response, image_url,
        me_too_count, city, scheduled_release_at, published_at, session_token, theme,
        governance_stamp
      )
      VALUES (
        ${content}, ${category || 'general'}, 0, ${ai_response}, ${image_url || null},
        0, ${city}, ${scheduledRelease}, ${publishedAt}, ${token}, ${theme},
        ${JSON.stringify(stamp)}::jsonb
      )
      RETURNING id, content, category, resonance, me_too_count,
                ai_response, image_url, ai_image_url, ai_image_generated_at,
                city, scheduled_release_at, published_at, boosted_until, theme, created_at,
                governance_stamp
    `;
    const row = result[0] as Record<string, unknown>;
    return NextResponse.json({ ...assertNoIdentity(row), _governance: stamp });
  } catch (e) {
    console.error('Submit secret error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
