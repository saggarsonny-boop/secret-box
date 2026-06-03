import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signTierCookie } from '@/lib/tier';
import { getDb } from '@/lib/db';
import type { Tier } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const mockPlan = searchParams.get('plan') as Tier || 'plus';
    const plan = searchParams.get('plan') || '';

    if (!sessionId) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    let tier: Tier = 'free';
    let secretId: string | null = null;

    if (sessionId.startsWith('mock_sess_')) {
      // Mock Mode Verification
      tier = ['plus', 'pro'].includes(mockPlan) ? mockPlan : 'plus';
      secretId = searchParams.get('secretId');
    } else {
      // Real Stripe Verification
      const stripeKey = process.env.STRIPE_KEY;
      if (!stripeKey) {
        return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
      }

      const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
        },
      });

      if (!sessionRes.ok) {
        console.error('Failed to fetch Stripe session:', await sessionRes.text());
        return NextResponse.redirect(new URL('/?error=payment_verification_failed', req.url));
      }

      const sessionData = await sessionRes.json() as {
        payment_status: string;
        status: string;
        metadata?: { tier?: string; secretId?: string };
      };

      if (sessionData.payment_status === 'paid' || sessionData.status === 'complete') {
        const stripeTier = sessionData.metadata?.tier;
        tier = (stripeTier === 'pro' || stripeTier === 'plus') ? stripeTier as Tier : 'plus';
        secretId = sessionData.metadata?.secretId || null;
      } else {
        console.error('Stripe session unpaid:', sessionData);
        return NextResponse.redirect(new URL('/?error=payment_unpaid', req.url));
      }
    }

    // Handle Micropayment Confession Boosts
    if (plan === 'boost' || secretId) {
      if (secretId) {
        const sql = getDb();
        await sql`
          UPDATE secrets
          SET boosted_until = NOW() + INTERVAL '24 hours'
          WHERE id = ${secretId}
        `;
      }
      return NextResponse.redirect(new URL('/?boosted=true', req.url));
    }

    // Set signed cookie and redirect to success page for tier subscriptions
    const jar = await cookies();
    
    // Sign the cookie using our cryptographic helper
    const signedValue = signTierCookie(tier);

    // Set cookie options: secure, httponly, samesite lax, 30 days expiry
    jar.set('hive_tier', signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.redirect(new URL(`/payment-success?tier=${tier}`, req.url));
  } catch (e) {
    console.error('Success callback error:', e);
    return NextResponse.redirect(new URL('/?error=internal_server_error', req.url));
  }
}
