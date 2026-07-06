'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { t, type Lang } from '@/lib/translations';
import { getDefaultLang } from '@/lib/strings';
import { useSound } from '@/lib/useSound';

type Secret = {
  id: number;
  content: string;
  category: string;
  resonance: number;
  me_too_count: number;
  ai_response?: string;
  image_url?: string | null;
  ai_image_url?: string | null;
  city?: string | null;
  boosted_until?: string | null;
  created_at: string;
};

type Comment = {
  id: number;
  secret_id: number;
  content: string;
  created_at: string;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds/3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds/86400)}d ago`;
  return `${Math.floor(seconds/604800)}w ago`;
}

export default function SecretClient({
  secret: initialSecret,
  initialComments,
  related,
}: {
  secret: Secret;
  initialComments: Comment[];
  related: Secret[];
}) {
  const [secret, setSecret] = useState<Secret>(initialSecret);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentInput, setCommentInput] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [meTooed, setMeTooed] = useState<boolean>(false);
  const [pulsing, setPulsing] = useState(false);
  const [aloneToast, setAloneToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  const turnstileWidgetRef = useRef<HTMLDivElement>(null);
  const turnstileIdRef = useRef<string | undefined>(undefined);
  const turnstileTokenRef = useRef<string | null>(null);
  const sound = useSound();
  const T = t[lang];

  const accent = '#D4AF37';
  const textAccent = '#c8b8a2';
  const dim = '#1a1a1a';

  useEffect(() => {
    setLang(getDefaultLang());
    try {
      const raw = localStorage.getItem('sb_me_too');
      if (raw) {
        const set = new Set(JSON.parse(raw) as number[]);
        if (set.has(secret.id)) setMeTooed(true);
      }
    } catch {}
  }, [secret.id]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const tryRender = () => {
      if (!window.turnstile || !turnstileWidgetRef.current || turnstileIdRef.current) return;
      turnstileIdRef.current = window.turnstile.render(turnstileWidgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        size: 'flexible',
        callback: (token: string) => {
          turnstileTokenRef.current = token;
        },
      });
    };
    tryRender();
    const iv = setInterval(tryRender, 500);
    return () => clearInterval(iv);
  }, []);

  async function handleMeToo() {
    if (meTooed) return;
    sound.play('me_too');
    setPulsing(true);
    setTimeout(() => setPulsing(false), 600);
    
    // Save to local storage
    try {
      const raw = localStorage.getItem('sb_me_too') || '[]';
      const arr = JSON.parse(raw) as number[];
      if (!arr.includes(secret.id)) {
        arr.push(secret.id);
        localStorage.setItem('sb_me_too', JSON.stringify(arr));
      }
    } catch {}

    setMeTooed(true);
    const nextCount = secret.me_too_count + 1;
    setSecret(prev => ({ ...prev, me_too_count: nextCount, resonance: prev.resonance + 1 }));
    setAloneToast(T.youAreNotAlone.replace('{n}', String(nextCount)));
    setTimeout(() => setAloneToast(null), 2400);

    try {
      await fetch('/api/me-too', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: secret.id }),
      });
    } catch {}
  }

  async function submitComment() {
    if (!commentInput || commentInput.length < 2 || commentLoading) return;
    setCommentLoading(true);
    setCommentError('');

    const body: Record<string, unknown> = { secret_id: secret.id, content: commentInput };
    if (turnstileTokenRef.current) body.turnstile_token = turnstileTokenRef.current;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        const msg =
          data.error === 'unkind'
            ? 'That might feel hurtful to someone brave enough to share. Try something kinder.'
            : data.error === 'rate_limited'
            ? T.rateLimited
            : data.error === 'captcha_failed'
            ? T.captchaFailed
            : data.error;
        setCommentError(msg);
      } else {
        sound.play('reply');
        setComments(prev => [...prev, data]);
        setCommentInput('');
      }
    } catch {
      setCommentError('Failed to send comment. Please try again.');
    } finally {
      setCommentLoading(false);
      if (turnstileIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileIdRef.current);
        turnstileTokenRef.current = null;
      }
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(secret.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareClick() {
    setSharing(true);
    const targetUrl = `${window.location.origin}/secret/${secret.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          text: `"${secret.content}" — you are not alone`,
          url: targetUrl,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(targetUrl);
      setAloneToast('Share link copied to clipboard!');
      setTimeout(() => setAloneToast(null), 2000);
    }
    setSharing(false);
  }

  async function triggerCheckout() {
    try {
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName: 'boost', secretId: secret.id }),
      });
      if (!res.ok) return;
      const data = await res.json() as { url: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Checkout redirect error:', e);
    }
  }

  const isBoosted = !!(secret.boosted_until && new Date(secret.boosted_until) > new Date());
  const overlayUrl = secret.ai_image_url || secret.image_url;

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      )}
      <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e8e8e8', fontFamily: 'Georgia, serif', maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <a href="/" style={{ textDecoration: 'none', color: accent, fontSize: '24px', fontWeight: '300', letterSpacing: '4px' }}>
            H I V E S E C R E T B O X
          </a>
          <p style={{ fontSize: '12px', color: '#666', marginTop: 4, letterSpacing: '2px' }}>YOU ARE NOT ALONE</p>
        </div>

        {/* Dynamic Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid #111', paddingBottom: 12 }}>
          <a href="/" style={{ color: '#888', fontSize: 12, letterSpacing: 2, textDecoration: 'none' }}>← RETURN TO FEED</a>
          <a href="/daily" style={{ color: '#888', fontSize: 12, letterSpacing: 2, textDecoration: 'none' }}>DAILY DROP →</a>
        </div>

        {/* Main Confession Card */}
        <article style={{
          borderLeft: isBoosted ? `2px solid ${accent}` : `2px solid ${dim}`,
          border: isBoosted ? `1px solid ${accent}` : undefined,
          background: isBoosted ? '#0f0e0a' : '#111',
          padding: '24px',
          marginBottom: '36px',
        }}>
          {overlayUrl && <img src={overlayUrl} alt="" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', marginBottom: 16, opacity: 0.85 }} />}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: '11px', color: isBoosted ? accent : '#555', letterSpacing: '2px', margin: 0 }}>
              {secret.category.toUpperCase()}{isBoosted ? ' · ⚡ BOOSTED' : ''}
            </p>
            <p style={{ fontSize: '11px', color: '#444', margin: 0 }}>{timeAgo(secret.created_at)}</p>
          </div>
          
          <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#fff', margin: '0 0 12px 0' }}>{secret.content}</p>
          
          <p style={{ fontSize: '11px', color: '#666', margin: '0 0 16px 0', fontStyle: 'italic' }}>
            {secret.city ? `someone in ${secret.city}` : 'somewhere in the world'}
          </p>

          {secret.ai_response && secret.ai_response !== 'You are not alone in this.' && (
            <div style={{ marginTop: '16px', borderLeft: `2px solid ${accent}`, paddingLeft: '16px', background: 'rgba(212,175,55,0.02)', padding: '12px 16px' }}>
              <p style={{ fontSize: '10px', color: accent, letterSpacing: '2px', margin: '0 0 6px 0', fontWeight: 'bold' }}>✦ AI COMPANION RESPONSE</p>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: textAccent, margin: 0, fontStyle: 'italic' }}>{secret.ai_response}</p>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleMeToo} style={{
              background: pulsing ? 'rgba(212,175,55,0.15)' : 'none',
              border: `1px solid ${meTooed ? accent : '#333'}`,
              color: meTooed ? accent : '#888',
              cursor: meTooed ? 'default' : 'pointer',
              fontSize: '13px',
              padding: '6px 12px',
              transition: 'all 0.3s',
              borderRadius: '4px',
              letterSpacing: '1px'
            }}>
              {meTooed ? '✓ ME TOO' : '◇ ME TOO'} { (secret.me_too_count + secret.resonance) > 0 ? `· ${secret.me_too_count + secret.resonance}` : '' }
            </button>
            
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? accent : '#666', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px' }}>
              {copied ? '✓ COPIED' : '⧉ COPY TEXT'}
            </button>

            <button onClick={handleShareClick} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px' }}>
              {sharing ? '...' : '↗ SHARE LINK'}
            </button>

            {!isBoosted && (
              <button onClick={triggerCheckout} style={{ background: 'none', border: 'none', color: '#8b8000', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
                ⚡ BOOST
              </button>
            )}
          </div>

          {aloneToast && (
            <p style={{ fontSize: 13, color: accent, marginTop: 14, fontStyle: 'italic' }}>
              {aloneToast}
            </p>
          )}

          {/* Whispers (Comments) Section */}
          <div style={{ marginTop: '24px', borderTop: `1px solid ${dim}`, paddingTop: '20px' }}>
            <p style={{ fontSize: '11px', color: '#555', letterSpacing: '2px', marginBottom: '16px' }}>WHISPERS</p>
            {comments.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#444', fontStyle: 'italic', marginBottom: '16px' }}>no whispers left yet. be the first to leave a kind word.</p>
            ) : (
              comments.map(c => (
                <p key={c.id} style={{ fontSize: '13px', color: '#aaa', margin: '0 0 10px 0', fontStyle: 'italic', lineHeight: 1.6 }}>&ldquo;{c.content}&rdquo;</p>
              ))
            )}

            {/* Comment Form */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <input
                value={commentInput}
                onChange={e => setCommentInput(e.target.value.slice(0, 80))}
                onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
                placeholder="leave a whisper..."
                style={{ flex: 1, background: '#0a0a0a', color: '#e8e8e8', border: '1px solid #222', padding: '8px 12px', fontSize: '12px', fontFamily: 'Georgia,serif' }}
              />
              <button
                onClick={submitComment}
                disabled={commentLoading || commentInput.length < 2}
                style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '8px 12px', cursor: commentInput.length >= 2 ? 'pointer' : 'default', fontSize: '11px', letterSpacing: '1px' }}
              >
                {commentLoading ? '...' : 'SEND'}
              </button>
            </div>
            {commentError && <p style={{ fontSize: '11px', color: '#c88', marginTop: '8px', lineHeight: '1.5' }}>{commentError}</p>}
            <p style={{ fontSize: '10px', color: '#2a2a2a', marginTop: '4px' }}>{commentInput.length}/80</p>
            {TURNSTILE_SITE_KEY && (
              <div ref={turnstileWidgetRef} style={{ marginTop: 10, minHeight: 40 }} />
            )}
          </div>
        </article>

        {/* Related Confessions Section */}
        {related.length > 0 && (
          <section style={{ marginTop: 40, borderTop: '1px solid #111', paddingTop: 24 }}>
            <p style={{ fontSize: '11px', color: accent, letterSpacing: '2px', marginBottom: '16px', fontWeight: 'bold' }}>✦ RELATED CONFESSIONS</p>
            {related.map(r => {
              const rMeToo = r.me_too_count + r.resonance;
              return (
                <a href={`/secret/${r.id}`} key={r.id} style={{ display: 'block', textDecoration: 'none', background: '#0c0c0c', border: '1px solid #1a1a1a', padding: '16px', marginBottom: '12px', transition: 'border 0.2s' }}>
                  <p style={{ fontSize: '11px', color: '#555', letterSpacing: '2px', margin: '0 0 6px 0' }}>{r.category.toUpperCase()}{rMeToo > 0 ? ` · ${rMeToo} ME TOO` : ''}</p>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#bbb', margin: 0 }}>{r.content.length > 100 ? `${r.content.slice(0, 97)}...` : r.content}</p>
                </a>
              );
            })}
          </section>
        )}

        <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #111' }}>
          <a href="/" style={{ color: '#666', fontSize: 12, letterSpacing: 2, textDecoration: 'none' }}>← BACK TO MAIN FEED</a>
        </div>
      </main>
    </>
  );
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
