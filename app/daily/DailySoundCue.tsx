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
