import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

async function getAIResponse(content: string): Promise<string> {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return 'You are not alone in this.';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Someone anonymously shared this secret: "${content}"\n\nWrite a single short, warm, human response (2-3 sentences max) that makes them feel less alone. No advice. Just compassion.`
        }]
      })
    });
    const data = await response.json();
    if (data.content && data.content[0]) return data.content[0].text;
    return 'You are not alone in this.';
  } catch {
    return 'You are not alone in this.';
  }
}

export async function GET() {
  try {
    const sql = getDb();
    const secrets = await sql`SELECT * FROM secrets ORDER BY created_at DESC LIMIT 50`;
    return NextResponse.json(secrets);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { content, category } = await req.json();
    if (!content || content.length < 5) return NextResponse.json({ error: 'Too short' }, { status: 400 });
    const ai_response = await getAIResponse(content);
    const sql = getDb();
    const result = await sql`
      INSERT INTO secrets (content, category, resonance, ai_response)
      VALUES (${content}, ${category || 'general'}, 0, ${ai_response})
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
