import { ImageResponse } from 'next/og';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

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

    const locationText = secret.city ? `someone in ${secret.city}` : 'someone in the world';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            padding: '40px',
            border: '4px solid #D4AF37',
            fontFamily: 'Georgia, serif',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px' }}>
            H I V E S E C R E T B O X
          </div>
          <div style={{ color: '#555', fontSize: '18px', fontStyle: 'italic', marginBottom: '30px' }}>
            {secret.category.toUpperCase()}
          </div>
          <div style={{ color: '#e8e8e8', fontSize: '32px', maxWidth: '900px', lineHeight: '1.5', marginBottom: '40px' }}>
            {secret.content.length > 250 ? secret.content.slice(0, 250) + '...' : secret.content}
          </div>
          <div style={{ color: '#888', fontSize: '20px', fontStyle: 'italic', marginBottom: '10px' }}>
            {locationText}
          </div>
          <div style={{ color: '#D4AF37', fontSize: '18px' }}>
            you are not alone · secretbox.hive.baby
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('OG generation error:', e);
    return new Response('Error generating image', { status: 500 });
  }
}
