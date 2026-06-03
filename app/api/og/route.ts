import { getDb } from '@/lib/db';
import { createCanvas } from 'canvas';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) {
      return new Response('Invalid ID', { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, content, category, city
      FROM secrets
      WHERE id = ${id}
    `;
    if (!rows.length) {
      return new Response('Not found', { status: 404 });
    }
    const secret = rows[0] as { id: number; content: string; category: string; city: string | null };

    // Set up canvas sizes matching standard OpenGraph dimensions (1200x630)
    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw gold border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Draw header watermarks
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('H I V E S E C R E T B O X', width / 2, 90);

    ctx.fillStyle = '#555';
    ctx.font = 'italic 18px Georgia';
    ctx.fillText(secret.category.toUpperCase(), width / 2, 130);

    // Draw confession text wrap logic
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '32px Georgia';
    
    const words = secret.content.split(' ');
    let line = '';
    const lines: string[] = [];
    const maxLineWidth = 900;
    
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxLineWidth && line) {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line = test;
      }
    }
    if (line) lines.push(line.trim());

    // Center text vertically
    const maxDisplayLines = 6;
    const displayedLines = lines.slice(0, maxDisplayLines);
    if (lines.length > maxDisplayLines) {
      displayedLines[maxDisplayLines - 1] += '...';
    }

    const startY = 320 - ((displayedLines.length - 1) * 48) / 2;
    displayedLines.forEach((l, i) => {
      ctx.fillText(l, width / 2, startY + i * 48);
    });

    // Draw footer
    const locationText = secret.city ? `someone in ${secret.city}` : 'someone in the world';
    ctx.fillStyle = '#888';
    ctx.font = 'italic 20px Georgia';
    ctx.fillText(locationText, width / 2, 500);

    ctx.fillStyle = '#D4AF37';
    ctx.font = '18px Georgia';
    ctx.fillText('you are not alone · secretbox.hive.baby', width / 2, 550);

    const buffer = canvas.toBuffer('image/png');
    
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (e) {
    console.error('OG generation error:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}
