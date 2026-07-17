export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userAgent } = await req.json() as { userAgent?: string };
    const ua = userAgent || req.headers.get('user-agent') || '';
    
    // Simple bot check
    const botPattern = /bot|crawler|spider|crawling|slurp|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|twitterbot/i;
    const isBot = botPattern.test(ua);

    const sql = getDb();
    await sql`
      INSERT INTO traffic_logs (is_bot, user_agent, action)
      VALUES (${isBot}, ${ua}, 'page_view')
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Tracking API error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
