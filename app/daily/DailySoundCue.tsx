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



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
