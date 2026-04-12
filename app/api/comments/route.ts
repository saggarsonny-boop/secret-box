import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

async function moderateComment(content: string): Promise<{safe: boolean; reason: string}> {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return { safe: true, reason: '' };
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: `Someone wants to comment on an anonymous secret with this message: "${content}"\n\nIs this comment kind, supportive, and safe? Or is it unkind, judgmental, sarcastic, mocking, or harmful?\n\nReply with only one word: KIND or UNKIND.`
        }]
      })
    });
    const data = await response.json();
    const answer = data.content[0].text.trim().toUpperCase();
    return answer === 'KIND' ? { safe: true, reason: '' } : { safe: false, reason: 'unkind' };
  } catch {
    return { safe: true, reason: '' };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret_id = searchParams.get('secret_id');
    if (!secret_id) return NextResponse.json([]);
    const sql = getDb();
    const comments = await sql`SELECT * FROM comments WHERE secret_id = ${secret_id} ORDER BY created_at ASC`;
    return NextResponse.json(comments);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { secret_id, content } = await req.json();
    if (!content || content.length < 2) return NextResponse.json({ error: 'Too short' }, { status: 400 });
    if (content.length > 80) return NextResponse.json({ error: 'Too long' }, { status: 400 });
    const { safe, reason } = await moderateComment(content);
    if (!safe) return NextResponse.json({ error: reason }, { status: 400 });
    const sql = getDb();
    const result = await sql`INSERT INTO comments (secret_id, content) VALUES (${secret_id}, ${content}) RETURNING *`;
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
