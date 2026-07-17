export const runtime = 'edge';

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ tier?: string }> }) {
  const { tier } = await searchParams;
  const planName = tier === 'pro' ? 'Pro' : 'Plus';

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e8e8e8', fontFamily: 'Georgia, serif', maxWidth: 600, margin: '0 auto', padding: '64px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ border: '1px solid #D4AF37', padding: '40px 24px', background: '#111', width: '100%', boxSizing: 'border-box' }}>
        <p style={{ fontSize: 11, color: '#D4AF37', letterSpacing: 4, marginBottom: 12 }}>✦ PAYMENT SUCCESSFUL</p>
        <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 3, color: '#D4AF37', margin: '0 0 16px 0' }}>you are not alone</h1>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: '#ccc', marginBottom: 24 }}>
          Thank you for supporting this engine. Your device has been upgraded to **HiveSecretBox {planName}**.
        </p>
        <div style={{ background: '#0c0c0c', border: '1px solid #222', padding: '16px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px 0', letterSpacing: 1 }}>UPGRADE COMPLETED</p>
          <p style={{ fontSize: 14, color: '#D4AF37', margin: 0, fontWeight: 'bold' }}>✓ {planName} Tier Active</p>
          <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0 0', lineHeight: 1.4 }}>
            Your signed access cookie is active. You now have unlocked premium capabilities including image generation for every submission.
          </p>
        </div>
        <a href="/" style={{ display: 'inline-block', background: '#D4AF37', color: '#0a0a0a', border: 'none', padding: '12px 32px', fontSize: 12, letterSpacing: 2, textDecoration: 'none', cursor: 'pointer', transition: 'background 0.3s' }}>
          RETURN TO THE FEED
        </a>
      </div>
    </main>
  );
}



{/* Stripe Checkout Block */}
<div id="stripe-checkout-cta" style={{ margin: '2rem auto', padding: '2.5rem', borderRadius: '16px', background: 'rgba(22, 26, 33, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', textAlign: 'center', fontFamily: 'Outfit, sans-serif', maxWidth: '600px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
    <h3 style={{ marginTop: 0, color: '#fff' }}>Activate Premium License</h3>
    <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: '#D4AF37', color: '#000000', fontWeight: '800', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '0.5px' }}>Unlock Now</a>
</div>
