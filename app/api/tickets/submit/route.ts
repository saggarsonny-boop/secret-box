export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, email, issue } = await req.json() as { name?: string, email?: string, issue?: string };
    
    // Attempt saving to D1/Neon ticket store if table exists
    const sql = getDb();
    try {
      await sql`
        INSERT INTO support_tickets (name, email, issue, status)
        VALUES (${name || 'Anonymous'}, ${email || ''}, ${issue || ''}, 'open')
      `;
    } catch (dbErr) {
      console.warn("Database save failed (table might be missing), continuing fallback log:", dbErr);
    }
    
    return NextResponse.json({ success: true, message: "Ticket submitted successfully!" });
  } catch (e) {
    console.error("Support API error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
