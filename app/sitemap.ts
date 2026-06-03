import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://secretbox.hive.baby';

  // 1. Static Routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/daily`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 2. Fetch published daily drop dates from DB
  try {
    const sql = getDb();
    const publishedDates = await sql`
      SELECT DISTINCT TO_CHAR(published_at, 'YYYY-MM-DD') as date_str
      FROM secrets
      WHERE published_at IS NOT NULL
      ORDER BY date_str DESC
    ` as { date_str: string }[];

    publishedDates.forEach(row => {
      if (row.date_str) {
        routes.push({
          url: `${baseUrl}/daily?date=${row.date_str}`,
          lastModified: new Date(row.date_str + 'T00:00:00Z'),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    });
  } catch (e) {
    console.error('Sitemap DB secrets fetch error:', e);
  }

  // 3. Fetch monthly art gallery dates from DB
  try {
    const sql = getDb();
    const artMonths = await sql`
      SELECT DISTINCT TO_CHAR(drop_month, 'YYYY-MM') as month_str
      FROM monthly_art
      ORDER BY month_str DESC
    ` as { month_str: string }[];

    artMonths.forEach(row => {
      if (row.month_str) {
        routes.push({
          url: `${baseUrl}/art/${row.month_str}`,
          lastModified: new Date(row.month_str + '-01T00:00:00Z'),
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    });
  } catch (e) {
    console.error('Sitemap DB art fetch error:', e);
  }

  return routes;
}
