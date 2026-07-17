'use client';
import { useEffect } from 'react';
import { useSound } from '@/lib/useSound';

// Plays the daily-drop wind chime once on /daily mount, gated on the
// user's saved sound preference. Browsers block AudioContext until a
// user gesture, so the cue is best-effort: when it fires before any
// gesture (e.g. direct navigation), it silently no-ops.

export default function DailySoundCue() {
  const sound = useSound();
  useEffect(() => {
    if (!sound.enabled) return;
    const timer = setTimeout(() => sound.play('daily'), 600);
    return () => clearTimeout(timer);
  }, [sound]);
  return null;
}



{/* Stripe Checkout Block */}
<div id="stripe-checkout-cta" style={{ margin: '2rem auto', padding: '2.5rem', borderRadius: '16px', background: 'rgba(22, 26, 33, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', textAlign: 'center', fontFamily: 'Outfit, sans-serif', maxWidth: '600px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
    <h3 style={{ marginTop: 0, color: '#fff' }}>Activate Premium License</h3>
    <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: '#D4AF37', color: '#000000', fontWeight: '800', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '0.5px' }}>Unlock Now</a>
</div>
