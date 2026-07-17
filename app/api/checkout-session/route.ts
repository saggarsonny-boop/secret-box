export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { planName, email, secretId } = await req.json() as {
      planName?: 'plus' | 'pro' | 'boost';
      email?: string;
      secretId?: number;
    };
    
    if (!planName || !['plus', 'pro', 'boost'].includes(planName)) {
      return NextResponse.json({ error: 'Invalid planName' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'secretbox.hive.baby';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    const stripeKey = process.env.STRIPE_KEY || process.env.STRIPE_LIVE_KEY;

    // Log checkout started event
    const sql = getDb();
    try {
      const ua = req.headers.get('user-agent') || '';
      const botPattern = /bot|crawler|spider|crawling/i;
      const isBot = botPattern.test(ua);
      await sql`
        INSERT INTO traffic_logs (is_bot, user_agent, action, plan)
        VALUES (${isBot}, ${ua}, 'checkout_started', ${planName})
      `;
    } catch (dbErr) {
      console.error('Failed to log checkout start to traffic_logs:', dbErr);
    }

    if (!stripeKey) {
      // Mock Mode for Local Development / Sandboxed Testing
      console.log('Stripe key is missing, generating mock checkout session redirect.');
      const mockSuccessUrl = `${origin}/api/payment-success-callback?session_id=mock_sess_${Date.now()}&plan=${planName}${secretId ? `&secretId=${secretId}` : ''}`;
      return NextResponse.json({ url: mockSuccessUrl });
    }

    // Resolve Price IDs based on planName
    let priceId = '';
    if (planName === 'plus') {
      priceId = process.env.STRIPE_PRICE_PLUS_MONTHLY || 'price_1P5dLu6Mv3sReEa0PlusMock';
    } else if (planName === 'pro') {
      priceId = process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1P5dLu6Mv3sReEa0ProMock';
    } else if (planName === 'boost') {
      priceId = process.env.STRIPE_PRICE_BOOST || 'price_1P5dLu6Mv3sReEa0BoostMock';
    }

    // Form-encoded parameters for Stripe Checkout session creation
    const params = new URLSearchParams();
    const mode = planName === 'boost' ? 'payment' : 'subscription';
    
    params.append('success_url', `${origin}/api/payment-success-callback?session_id={CHECKOUT_SESSION_ID}&plan=${planName}`);
    params.append('cancel_url', `${origin}/`);
    params.append('mode', mode);
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[tier]', planName);
    
    if (planName === 'boost') {
      if (!secretId) {
        return NextResponse.json({ error: 'Missing secretId for boost' }, { status: 400 });
      }
      params.append('metadata[secretId]', String(secretId));
    }
    
    if (email) {
      params.append('customer_email', email);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Stripe API error:', errBody);
      return NextResponse.json({ error: `Stripe error: ${response.status}` }, { status: 502 });
    }

    const session = await response.json() as { url: string };
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('Checkout session route error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
