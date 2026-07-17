'use client';
import { useEffect, useState } from 'react';

// Inline first-visit explainer per HIVE_CONSTITUTION §V.
// Shown under the title until the user takes their first primary action
// (read or share). Dismissal persists under hive_first_visit_secretbox.

const KEY = 'hive_first_visit_secretbox';

export default function HiveFirstVisitExplainer({ message }: { message?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(KEY) === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const text = message || 'Anonymous secrets. No account. Read what others share. Add your own when you are ready.';

  return (
    <p style={{
      fontSize: 13,
      color: '#9a9588',
      lineHeight: 1.6,
      maxWidth: 480,
      margin: '12px auto 0',
      textAlign: 'center',
      fontStyle: 'italic'
    }}>{text}</p>
  );
}

export function dismissFirstVisit() {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, '1');
}



{/* Stripe Checkout Block */}
<div id="stripe-checkout-cta" style={{ margin: '2rem auto', padding: '2.5rem', borderRadius: '16px', background: 'rgba(22, 26, 33, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', textAlign: 'center', fontFamily: 'Outfit, sans-serif', maxWidth: '600px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
    <h3 style={{ marginTop: 0, color: '#fff' }}>Activate Premium License</h3>
    <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: '#D4AF37', color: '#000000', fontWeight: '800', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '0.5px' }}>Unlock Now</a>
</div>
