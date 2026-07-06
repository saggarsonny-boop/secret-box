import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SecretClient from './SecretClient';

type Secret = {
  id: number;
  content: string;
  category: string;
  resonance: number;
  me_too_count: number;
  ai_response?: string;
  image_url?: string | null;
  ai_image_url?: string | null;
  city?: string | null;
  boosted_until?: string | null;
  created_at: string;
};

type Comment = {
  id: number;
  secret_id: number;
  content: string;
  created_at: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSecretData(id: string): Promise<{ secret: Secret; comments: Comment[]; related: Secret[] } | null> {
  try {
    const sql = getDb();
    
    // 1. Fetch secret
    const secretRows = await sql`
      SELECT id, content, category, resonance, me_too_count, ai_response, image_url, ai_image_url, city, boosted_until, created_at
      FROM secrets
      WHERE id = ${id} AND published_at IS NOT NULL
    ` as Secret[];

    if (secretRows.length === 0) return null;
    const secret = secretRows[0];

    // 2. Fetch comments
    const commentRows = await sql`
      SELECT id, secret_id, content, created_at
      FROM comments
      WHERE secret_id = ${id}
      ORDER BY created_at ASC
    ` as Comment[];

    // 3. Fetch related secrets (3 latest secrets in same category, excluding current)
    const relatedRows = await sql`
      SELECT id, content, category, resonance, me_too_count, ai_response, image_url, ai_image_url, city, boosted_until, created_at
      FROM secrets
      WHERE category = ${secret.category} AND id != ${secret.id} AND published_at IS NOT NULL
      ORDER BY published_at DESC
      LIMIT 3
    ` as Secret[];

    return { secret, comments: commentRows, related: relatedRows };
  } catch (e) {
    console.error('Failed to fetch secret page data:', e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getSecretData(id);
  if (!data) {
    return {
      title: 'Confession Not Found | HiveSecretBox',
      description: 'The requested anonymous secret does not exist or has been removed.',
    };
  }

  const text = data.secret.content;
  const truncatedText = text.length > 80 ? `${text.slice(0, 77)}...` : text;
  const ogImageUrl = `/api/og?id=${data.secret.id}`;

  return {
    title: `Confession #${data.secret.id} (${data.secret.category}) — "${truncatedText}"`,
    description: `Read this anonymous confession about ${data.secret.category} on HiveSecretBox. No accounts, no tracking. You are not alone.`,
    openGraph: {
      title: `Confession #${data.secret.id} — HiveSecretBox`,
      description: truncatedText,
      url: `https://secretbox.hive.baby/secret/${data.secret.id}`,
      siteName: 'HiveSecretBox',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Confession #${data.secret.id} — HiveSecretBox`,
      description: truncatedText,
      images: [ogImageUrl],
    },
  };
}

export default async function SecretPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSecretData(id);
  if (!data) notFound();

  const { secret, comments, related } = data;

  // JSON-LD structured data for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    '@id': `https://secretbox.hive.baby/secret/${secret.id}`,
    'headline': `Anonymous Confession #${secret.id} on HiveSecretBox`,
    'datePublished': secret.created_at,
    'articleBody': secret.content,
    'author': {
      '@type': 'Person',
      'name': 'Anonymous',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'HiveSecretBox',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://secretbox.hive.baby/hive-logo-full.png',
      },
    },
    'about': {
      '@type': 'Thing',
      'name': secret.category,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SecretClient secret={secret} initialComments={comments} related={related} />
    </>
  );
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
