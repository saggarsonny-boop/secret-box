'use client';
import { useCallback, useEffect, useState } from 'react';

// Subtle ambient sounds for key interactions.
// Synthesised via Web Audio API rather than bundled MP3s — keeps the
// engine zero-additional-bytes (no /public/sounds/ payload), works
// offline, and gives full control over warmth/decay so the four cues
// stay coherent. User preference persists in localStorage; default ON.
//
// Operator can swap any cue for a CC0 MP3 from /public/sounds/<name>.mp3
// by editing playSound() — the public hook surface stays identical.

const STORAGE_KEY = 'sb_sound_pref';

export type SoundCue = 'submit' | 'me_too' | 'daily' | 'reply';

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx && ctx.state !== 'closed') return ctx;
  type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
  const W = window as WindowWithWebkit;
  const Klass = window.AudioContext || W.webkitAudioContext;
  if (!Klass) return null;
  ctx = new Klass();
  return ctx;
}

function tone(freq: number, startSec: number, durSec: number, attack = 0.02, release = 0.2, type: OscillatorType = 'sine', gain = 0.18) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + startSec;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec - release > t0 + attack ? t0 + durSec : t0 + attack + 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.05);
}

function noiseSwell(durSec: number, gain = 0.04) {
  const c = getCtx();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * durSec), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durSec);
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + durSec);
}

function playSubmit() {
  // Soft bell + paper-folding noise (1.5s)
  tone(587.33, 0,    0.9, 0.02, 0.6, 'sine', 0.16); // D5 bell
  tone(880.00, 0.05, 0.7, 0.02, 0.5, 'sine', 0.10); // A5 overtone
  noiseSwell(1.4, 0.05);
}
function playMeToo() {
  // Gentle chime ~300ms
  tone(987.77, 0,    0.30, 0.01, 0.18, 'sine', 0.18); // B5
  tone(1318.51, 0.04, 0.26, 0.01, 0.16, 'sine', 0.10); // E6
}
function playDaily() {
  // Subtle wind chime ~2s
  const notes = [523.25, 659.25, 783.99, 987.77]; // C5 E5 G5 B5
  notes.forEach((f, i) => tone(f, i * 0.18, 1.2, 0.02, 0.6, 'triangle', 0.10));
  noiseSwell(2.0, 0.025);
}
function playReply() {
  // Soft whisper-ish notification ~1s
  tone(440, 0,    0.6, 0.04, 0.4, 'sine', 0.10);
  tone(660, 0.12, 0.5, 0.04, 0.3, 'sine', 0.08);
  noiseSwell(0.9, 0.04);
}

const PLAYERS: Record<SoundCue, () => void> = {
  submit: playSubmit,
  me_too: playMeToo,
  daily: playDaily,
  reply: playReply,
};

export function useSound(): {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  play: (cue: SoundCue) => void;
} {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '0') setEnabledState(false);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
  }, []);

  const play = useCallback((cue: SoundCue) => {
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      if (c.state === 'suspended') c.resume().catch(() => {});
      PLAYERS[cue]();
    } catch {
      // Audio failures must never propagate.
    }
  }, [enabled]);

  return { enabled, setEnabled, play };
}
