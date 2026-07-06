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



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
