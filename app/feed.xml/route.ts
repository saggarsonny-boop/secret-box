import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 900; // Cache for 15 minutes

export async function GET() {
  try {
    const host = process.env.ENGINE_URL ? new URL(process.env.ENGINE_URL).hostname : 'secretbox.hive.baby';
    const protocol = process.env.ENGINE_URL ? new URL(process.env.ENGINE_URL).protocol : 'https:';
    const baseUrl = `${protocol}//${host}`;

    const sql = getDb();
    const rows = await sql`
      SELECT id, content, category, published_at
      FROM secrets
      WHERE published_at IS NOT NULL
      ORDER BY published_at DESC
      LIMIT 50
    ` as { id: number; content: string; category: string; published_at: string }[];

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>HiveSecretBox — Anonymous Confessions</title>
  <link>${baseUrl}</link>
  <description>Anonymous secrets. No accounts, no IP storage, no tracking. Say the thing you haven't said.</description>
  <language>en-us</language>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

    for (const secret of rows) {
      // Escape content for safety and format dates to RFC-822 (toUTCString)
      const pubDate = new Date(secret.published_at).toUTCString();
      const cleanContent = secret.content.replace(/]]>/g, ']]&gt;');
      xml += `  <item>
    <title>Confession #${secret.id} (${secret.category})</title>
    <link>${baseUrl}/secret/${secret.id}</link>
    <description><![CDATA[${cleanContent}]]></description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="true">${baseUrl}/secret/${secret.id}</guid>
    <category>${secret.category}</category>
  </item>
`;
    }

    xml += `</channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, s-maxage=900',
      },
    });
  } catch (e) {
    console.error('Failed to generate RSS feed:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}
