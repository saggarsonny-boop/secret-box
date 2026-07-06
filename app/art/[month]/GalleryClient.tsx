'use client';
import { useState } from 'react';

type Poster = {
  secret_id: number;
  content: string;
  category: string;
  me_too_count: number;
  city: string | null;
  url: string | null;
};

export default function GalleryClient({ month, posters }: { month: string; posters: Poster[] }) {
  const [downloading, setDownloading] = useState<number | null>(null);

  async function downloadPoster(p: Poster) {
    setDownloading(p.secret_id);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 1080, 1350);
      if (p.url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); img.src = p.url!; });
        ctx.globalAlpha = 0.55;
        ctx.drawImage(img, 0, 0, 1080, 1080);
        ctx.globalAlpha = 1;
      }
      const grad = ctx.createLinearGradient(0, 700, 0, 1350);
      grad.addColorStop(0, 'rgba(10,10,10,0)');
      grad.addColorStop(0.5, 'rgba(10,10,10,0.85)');
      grad.addColorStop(1, 'rgba(10,10,10,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 700, 1080, 650);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 1000, 1270);
      ctx.fillStyle = '#D4AF37';
      ctx.font = '24px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('HIVESECRETBOX', 540, 100);
      ctx.fillStyle = '#888';
      ctx.font = '18px Georgia';
      ctx.fillText(p.category.toUpperCase(), 540, 140);
      ctx.fillStyle = '#e8e8e8';
      ctx.font = '34px Georgia';
      const words = p.content.split(' ');
      let line = ''; const lines: string[] = [];
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > 880 && line) { lines.push(line.trim()); line = w + ' '; } else line = test;
      }
      if (line) lines.push(line.trim());
      const startY = 1000 - ((lines.length - 1) * 50) / 2;
      lines.forEach((l, i) => ctx.fillText(l, 540, startY + i * 50));
      ctx.fillStyle = '#666';
      ctx.font = '15px Georgia';
      ctx.fillText(p.city ? `someone in ${p.city}` : 'somewhere in the world', 540, 1230);
      ctx.fillStyle = '#D4AF37';
      ctx.font = '16px Georgia';
      ctx.fillText('secretbox.hive.baby', 540, 1270);
      const blob: Blob = await new Promise((r, rej) => canvas.toBlob(b => b ? r(b) : rej(new Error('toBlob failed'))));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secretbox-${month}-${p.secret_id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  async function shareNative(p: Poster) {
    const shareUrl = `https://secretbox.hive.baby/art/${month}`;
    const text = `"${p.content}" — public art from HiveSecretBox\n\n${shareUrl}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text, url: shareUrl }); return; } catch { /* fall through */ }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {posters.map(p => (
        <article key={p.secret_id} style={{ border: '1px solid #1a1a1a', background: '#111', overflow: 'hidden' }}>
          <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#0a0a0a', overflow: 'hidden' }}>
            {p.url ? (
              <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12 }}>no art</div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0) 50%, rgba(10,10,10,0.85) 100%)' }} />
          </div>
          <div style={{ padding: 12 }}>
            <p style={{ fontSize: 10, color: '#D4AF37', letterSpacing: 2, margin: '0 0 8px 0' }}>{p.category.toUpperCase()} · {p.me_too_count} ME TOO</p>
            <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, margin: '0 0 10px 0' }}>{p.content}</p>
            <p style={{ fontSize: 10, color: '#555', margin: '0 0 12px 0', fontStyle: 'italic' }}>{p.city ? `someone in ${p.city}` : 'somewhere in the world'}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => downloadPoster(p)} disabled={downloading === p.secret_id} style={{ flex: 1, background: '#D4AF37', color: '#0a0a0a', border: 'none', padding: '6px 10px', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
                {downloading === p.secret_id ? '...' : '↓ POSTER'}
              </button>
              <button onClick={() => shareNative(p)} style={{ flex: 1, background: 'transparent', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px 10px', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
                ↗ SHARE
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
