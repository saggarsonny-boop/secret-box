'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { t, type Lang } from '@/lib/translations';
import { getDefaultLang } from '@/lib/strings';
import AutoDemo from '@/components/AutoDemo';
import FirstVisitCard from '@/components/FirstVisitCard';
import TooltipTour from '@/components/TooltipTour';
import HiveInstallHint from '@/components/HiveInstallHint';
import HiveFirstVisitExplainer, { dismissFirstVisit } from '@/components/HiveFirstVisitExplainer';
import { useSound } from '@/lib/useSound';

type Secret = {
  id: number;
  content: string;
  category: string;
  resonance: number;
  me_too_count?: number;
  created_at: string;
  ai_response?: string;
  image_url?: string;
  ai_image_url?: string | null;
  city?: string | null;
  published_at?: string | null;
  scheduled_release_at?: string | null;
  boosted_until?: string | null;
};
type Comment = { id: number; secret_id: number; content: string; created_at: string };
type Pending = { id: number; content: string; category: string; scheduled_release_at: string; created_at: string };

const MOODS = ['hollow','anxious','hopeful','numb','ashamed','seen','grief','love','lonely','angry','lost','grateful','trapped','invisible','broken','healing'];

const ROTATING_PLACEHOLDERS = [
  "the thing you've never told anyone…",
  "the version of you no one's met…",
  "what kept you awake last night…",
  "the apology you can't deliver…",
  "the want you don't say out loud…",
  "the relief you feel guilty about…",
  "the love you didn't return…",
  "the fear you carry quietly…",
];
const FILTERS = [...MOODS, 'all'];
const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
  { code: 'hi', label: 'HI' },
  { code: 'zh', label: 'ZH' }
];

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement | string, opts: { sitekey: string; callback: (t: string) => void; theme?: string; size?: string }) => string;
      reset: (id?: string) => void;
      getResponse: (id?: string) => string | undefined;
    };
  }
}

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

function timeUntil(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  if (seconds <= 0) return 'releasing...';
  if (seconds < 3600) return `in ${Math.floor(seconds/60)}m`;
  if (seconds < 86400) return `in ${Math.floor(seconds/3600)}h`;
  return `in ${Math.floor(seconds/86400)}d`;
}

function is3AM(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour < 5;
}

function loadMeTooSet(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('sb_me_too');
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveMeTooSet(set: Set<number>) {
  try { localStorage.setItem('sb_me_too', JSON.stringify([...set])); } catch {}
}

export default function Home() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [mostFelt, setMostFelt] = useState<Secret|null>(null);
  const [secretOfDay, setSecretOfDay] = useState<Secret|null>(null);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('all');
  const [lang, setLang] = useState<Lang>('en');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [view, setView] = useState<'feed'|'submit'|'followup'>('feed');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [boostedSuccess, setBoostedSuccess] = useState(false);
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [followupDone, setFollowupDone] = useState(false);
  const [meTooed, setMeTooed] = useState<Set<number>>(new Set());
  const [pulsing, setPulsing] = useState<number|null>(null);
  const [aloneToast, setAloneToast] = useState<{id: number; n: number}|null>(null);
  const [sharing, setSharing] = useState<number|null>(null);
  const [sharePreview, setSharePreview] = useState<{url: string; secret: Secret}|null>(null);
  const [copied, setCopied] = useState<number|null>(null);
  const [random, setRandom] = useState<Secret|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string|null>(null);
  const [imageError, setImageError] = useState<string|null>(null);
  const [personalInfoWarning, setPersonalInfoWarning] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [commentError, setCommentError] = useState<Record<number, string>>({});
  const [commentLoading, setCommentLoading] = useState<number|null>(null);
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [newCount, setNewCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [shareCity, setShareCity] = useState(true);
  const [schedule, setSchedule] = useState<'now'|'24h'|'7d'>('24h');
  const [pending, setPending] = useState<Pending[]>([]);
  const [similar, setSimilar] = useState<Secret[]>([]);
  const sound = useSound();
  const [submitError, setSubmitError] = useState<string|null>(null);
  const [nightMode] = useState(is3AM());
  const lastFetchTime = useRef(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver|null>(null);
  const turnstileWidgetRef = useRef<HTMLDivElement>(null);
  const turnstileIdRef = useRef<string|undefined>(undefined);
  const turnstileTokenRef = useRef<string|null>(null);
  const T = t[lang];

  const bg = nightMode ? '#050505' : '#0a0a0a';
  const accent = nightMode ? '#9b7fa6' : '#D4AF37';
  const textAccent = nightMode ? '#9b7fa6' : '#c8b8a2';
  const dim = nightMode ? '#1a1020' : '#1a1a1a';

  useEffect(() => {
    setLang(getDefaultLang());
    setMeTooed(loadMeTooSet());
    fetch('/api/secrets').then(r=>r.json()).then(data => {
      setSecrets(data);
      lastFetchTime.current = Date.now();
    }).catch(()=>{});
    fetch('/api/mostfelt').then(r=>r.json()).then(setMostFelt).catch(()=>{});
    fetch('/api/secretofday').then(r=>r.json()).then(setSecretOfDay).catch(()=>{});
    fetch('/api/secrets-pending').then(r=>r.json()).then(d => Array.isArray(d) && setPending(d)).catch(()=>{});

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('boosted') === 'true') {
      setBoostedSuccess(true);
      setTimeout(() => setBoostedSuccess(false), 8000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (view !== 'submit' || content.length > 0) return;
    const iv = setInterval(() => setPlaceholderIdx(i => (i + 1) % 8), 5000);
    return () => clearInterval(iv);
  }, [view, content.length]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live?since=${lastFetchTime.current}`);
        const data = await res.json();
        if (data.newCount > 0) { setNewCount(data.newCount); setPulse(true); setTimeout(() => setPulse(false), 1000); }
        setActiveCount(data.activeCount);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (view !== 'submit' || !TURNSTILE_SITE_KEY) return;
    const tryRender = () => {
      if (!window.turnstile || !turnstileWidgetRef.current || turnstileIdRef.current) return;
      turnstileIdRef.current = window.turnstile.render(turnstileWidgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        size: 'flexible',
        callback: (token: string) => { turnstileTokenRef.current = token; }
      });
    };
    tryRender();
    const iv = setInterval(tryRender, 500);
    return () => clearInterval(iv);
  }, [view]);

  async function loadNewSecrets() {
    const res = await fetch('/api/secrets');
    const data = await res.json();
    setSecrets(data);
    lastFetchTime.current = Date.now();
    setNewCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      secrets.slice(0, visibleCount).forEach((s, i) => {
        setTimeout(() => setVisible(prev => new Set([...prev, s.id])), i * 80);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [secrets, visibleCount]);

  const totalSecrets = secrets.length;
  const totalMeToo = secrets.reduce((sum, s) => sum + (s.me_too_count || 0) + s.resonance, 0);
  const filtered = filter === 'all' ? secrets : secrets.filter(s => s.category === filter);
  const visibleSecrets = filtered.slice(0, visibleCount);

  const loadMoreRef = useCallback((node: HTMLDivElement|null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(prev => prev + 10);
    });
    observerRef.current.observe(node);
  }, []);

  async function loadComments(secret_id: number) {
    if (comments[secret_id]) return;
    const res = await fetch(`/api/comments?secret_id=${secret_id}`);
    const data = await res.json();
    setComments(prev => ({...prev, [secret_id]: data}));
  }

  function toggleComments(secret_id: number) {
    setShowComments(prev => {
      const next = new Set(prev);
      if (next.has(secret_id)) { next.delete(secret_id); }
      else { next.add(secret_id); loadComments(secret_id); }
      return next;
    });
  }

  async function submitComment(secret_id: number) {
    const text = commentInput[secret_id];
    if (!text || text.length < 2) return;
    setCommentLoading(secret_id);
    setCommentError(prev => ({...prev, [secret_id]: ''}));
    const body: Record<string, unknown> = { secret_id, content: text };
    if (turnstileTokenRef.current) body.turnstile_token = turnstileTokenRef.current;
    const res = await fetch('/api/comments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error) {
      const msg = data.error === 'unkind' ? 'That might feel hurtful to someone brave enough to share. Try something kinder.'
        : data.error === 'rate_limited' ? T.rateLimited
        : data.error === 'captcha_failed' ? T.captchaFailed
        : data.error;
      setCommentError(prev => ({...prev, [secret_id]: msg}));
    } else {
      sound.play('reply');
      setComments(prev => ({...prev, [secret_id]: [...(prev[secret_id]||[]), data]}));
      setCommentInput(prev => ({...prev, [secret_id]: ''}));
    }
    setCommentLoading(null);
  }

  function showRandom() {
    const pool = secrets.filter(s => s.id !== random?.id);
    if (pool.length === 0) return;
    setRandom(pool[Math.floor(Math.random() * pool.length)]);
    dismissFirstVisit();
  }

  function checkPersonalInfo(text: string) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?)(\d{3}[\s.-]?\d{4})/;
    const namePatterns = /my name is|i am called|i'm called|call me/i;
    setPersonalInfoWarning(emailRegex.test(text) || phoneRegex.test(text) || namePatterns.test(text));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setImageError('Image must be under 5MB'); return; }
    setImageError(null); setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      try {
        const body: Record<string, unknown> = { image: base64 };
        if (turnstileTokenRef.current) body.turnstile_token = turnstileTokenRef.current;
        const res = await fetch('/api/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) { setImageError(data.error); setImagePreview(null); }
        else setImageUrl(data.url);
      } catch { setImageError(T.uploadFailed); setImagePreview(null); }
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() { setImagePreview(null); setImageUrl(null); setImageError(null); if (fileRef.current) fileRef.current.value = ''; }

  async function handleSubmit() {
    if (content.length < 5 || !category || imageUploading || personalInfoWarning) return;
    setSubmitError(null);
    setLoading(true);
    const body: Record<string, unknown> = {
      content,
      category,
      image_url: imageUrl,
      share_city: shareCity,
      schedule
    };
    if (turnstileTokenRef.current) body.turnstile_token = turnstileTokenRef.current;
    const res = await fetch('/api/secrets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error === 'personal_info') { setPersonalInfoWarning(true); setLoading(false); return; }
    if (data.error === 'rate_limited') { setSubmitError(T.rateLimited); setLoading(false); return; }
    if (data.error === 'captcha_failed') { setSubmitError(T.captchaFailed); setLoading(false); window.turnstile?.reset(turnstileIdRef.current); turnstileTokenRef.current = null; return; }
    if (data.error) { setSubmitError(String(data.error)); setLoading(false); return; }
    setLoading(false);
    setSubmitted(true);
    setView('followup');
    dismissFirstVisit();
    sound.play('submit');
    if (data.id && schedule === 'now') {
      fetch('/api/ai-image', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: data.id }) }).catch(()=>{});
      // Recognition by similarity — wait briefly for the theme classification
      // to land in the row, then fetch matches. The /api/similar endpoint
      // returns [] gracefully when the theme hasn't been written yet.
      setSimilar([]);
      setTimeout(() => {
        fetch(`/api/similar?secret_id=${data.id}`).then(r => r.json()).then(rows => {
          if (Array.isArray(rows)) setSimilar(rows);
        }).catch(()=>{});
      }, 1200);
    }
    if (data.id && schedule !== 'now') {
      setPending(p => [...p, { id: data.id, content: data.content, category: data.category, scheduled_release_at: data.scheduled_release_at, created_at: data.created_at }]);
    }
    if (turnstileIdRef.current) {
      window.turnstile?.reset(turnstileIdRef.current);
      turnstileTokenRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }

  async function handleMeToo(id: number) {
    if (meTooed.has(id)) return;
    sound.play('me_too');
    setPulsing(id); setTimeout(() => setPulsing(null), 600);
    const next = new Set(meTooed); next.add(id); setMeTooed(next); saveMeTooSet(next);
    let nextCount = 1;
    setSecrets(s => s.map(x => {
      if (x.id !== id) return x;
      nextCount = (x.me_too_count || 0) + 1;
      return { ...x, me_too_count: nextCount, resonance: x.resonance + 1 };
    }));
    if (random?.id === id) setRandom(prev => prev ? { ...prev, me_too_count: (prev.me_too_count || 0) + 1, resonance: prev.resonance + 1 } : null);
    setAloneToast({ id, n: nextCount });
    setTimeout(() => setAloneToast(null), 2400);
    try {
      const res = await fetch('/api/me-too', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.me_too_count) {
        setSecrets(s => s.map(x => x.id === id ? { ...x, me_too_count: data.me_too_count, resonance: data.resonance } : x));
      }
    } catch {}
    dismissFirstVisit();
  }

  async function triggerCheckout(planName: 'plus' | 'pro' | 'boost', secretId?: number) {
    try {
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, secretId })
      });
      if (!res.ok) {
        console.error('Checkout creation failed');
        return;
      }
      const data = await res.json() as { url: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Checkout redirect error:', e);
    }
  }

  async function cancelPending(id: number) {
    try {
      const res = await fetch('/api/secrets-pending', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
      if (res.ok) setPending(p => p.filter(x => x.id !== id));
    } catch {}
  }

  function handleCopy(secret: Secret) {
    navigator.clipboard.writeText(secret.content);
    setCopied(secret.id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function generateShareImage(secret: Secret): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = nightMode ? '#050505' : '#0a0a0a';
    ctx.fillRect(0, 0, 1080, 1080);
    const overlayUrl = secret.ai_image_url || secret.image_url;
    if (overlayUrl) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise(r => { img.onload = r; img.onerror = r; img.src = overlayUrl; });
      ctx.globalAlpha = 0.35; ctx.drawImage(img, 0, 0, 1080, 1080); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2; ctx.strokeRect(60, 60, 960, 960);
    ctx.fillStyle = '#D4AF37'; ctx.font = '28px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('HIVESECRETBOX', 540, 140);
    ctx.fillStyle = '#666'; ctx.font = '22px Georgia'; ctx.fillText(secret.category.toUpperCase(), 540, 200);
    ctx.fillStyle = '#e8e8e8'; ctx.font = '38px Georgia';
    const words = secret.content.split(' '); let line = ''; const lines: string[] = [];
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > 820 && line) { lines.push(line.trim()); line = word + ' '; } else line = test;
    }
    if (line) lines.push(line.trim());
    const startY = 540 - ((lines.length - 1) * 56) / 2;
    lines.forEach((l, i) => ctx.fillText(l, 540, startY + i * 56));
    ctx.fillStyle = '#D4AF37'; ctx.font = '24px Georgia'; ctx.fillText('you are not alone', 540, 900);
    ctx.fillStyle = '#444'; ctx.font = '20px Georgia'; ctx.fillText('secretbox.hive.baby', 540, 960);
    return new Promise(resolve => canvas.toBlob(blob => {
      resolve(URL.createObjectURL(blob!));
    }));
  }

  async function handleShareClick(secret: Secret) {
    setSharing(secret.id);
    const url = await generateShareImage(secret);
    setSharing(null);
    setSharePreview({ url, secret });
  }

  function downloadShare() {
    if (!sharePreview) return;
    const a = document.createElement('a');
    a.href = sharePreview.url;
    a.download = 'hivesecretbox.png';
    a.click();
  }

  async function nativeShare() {
    if (!sharePreview) return;
    const shareUrl = `${window.location.origin}/secret/${sharePreview.secret.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: `"${sharePreview.secret.content}" — you are not alone`, url: shareUrl });
      } catch {}
    } else {
      downloadShare();
    }
    setSharePreview(null);
  }

  const SecretCard = ({ s, featured = false, label = '' }: { s: Secret; featured?: boolean; label?: string }) => {
    const meTooCount = (s.me_too_count || 0) + s.resonance;
    const cityLine = s.city ? T.someoneIn.replace('{city}', s.city) : T.somewhereInWorld;
    const overlayUrl = s.ai_image_url || s.image_url;
    const isBoosted = !!(s.boosted_until && new Date(s.boosted_until) > new Date());
    return (
      <div style={{
        borderLeft: featured ? 'none' : (isBoosted ? `2px solid ${accent}` : `2px solid ${dim}`),
        border: featured || isBoosted ? `1px solid ${accent}` : undefined,
        background: featured || isBoosted ? (isBoosted ? '#0f0e0a' : '#111') : undefined,
        padding: featured || isBoosted ? '20px' : `0 0 0 16px`,
        marginBottom:'36px',
        opacity: visible.has(s.id) ? 1 : 0,
        transform: visible.has(s.id) ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {overlayUrl && <img src={overlayUrl} alt="" style={{width:'100%',maxHeight:'300px',objectFit:'cover',marginBottom:'12px',opacity:0.85}} />}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
          <p style={{fontSize:'11px',color: featured || isBoosted ? accent : '#444',letterSpacing:'2px',margin:0}}>
            {s.category.toUpperCase()}{label ? ` · ${label}` : ''}{isBoosted ? ' · ⚡ BOOSTED' : ''}
          </p>
          <p style={{fontSize:'11px',color:'#333',margin:0}}>{timeAgo(s.created_at)}</p>
        </div>
        <p style={{fontSize: featured || isBoosted ? '17px' : '16px',lineHeight:'1.7',color: featured || isBoosted ? '#fff' : '#ccc'}}>{s.content}</p>
        <p style={{fontSize:'11px',color:'#555',margin:'8px 0 0 0',fontStyle:'italic'}}>{cityLine}</p>
        {s.ai_response && s.ai_response !== 'You are not alone in this.' && (
          <p style={{fontSize:'14px',lineHeight:'1.7',color:textAccent,marginTop:'12px',fontStyle:'italic',borderLeft:'1px solid #333',paddingLeft:'12px'}}>{s.ai_response}</p>
        )}
        <div style={{display:'flex',gap:'16px',marginTop:'12px',alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={()=>handleMeToo(s.id)} style={{background: pulsing===s.id?'rgba(212,175,55,0.15)':'none',border: `1px solid ${meTooed.has(s.id) ? accent : 'transparent'}`,color: meTooed.has(s.id)?accent:'#888',cursor: meTooed.has(s.id)?'default':'pointer',fontSize:'13px',padding:'4px 10px',transition:'all 0.3s',transform: pulsing===s.id?'scale(1.15)':'scale(1)',borderRadius:'4px',letterSpacing:'1px'}}>
            {meTooed.has(s.id) ? `✓ ${T.meToo}` : `◇ ${T.meToo}`} {meTooCount > 0 ? `· ${meTooCount}` : ''}
          </button>
          <button onClick={()=>toggleComments(s.id)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'11px',padding:'0',letterSpacing:'1px'}}>
            ◌ {showComments.has(s.id) ? 'HIDE' : 'WHISPER'}
          </button>
          <button onClick={()=>handleCopy(s)} style={{background:'none',border:'none',color: copied===s.id?accent:'#444',cursor:'pointer',fontSize:'11px',padding:'0',letterSpacing:'1px'}}>
            {copied===s.id ? T.copied : T.copy}
          </button>
          <button onClick={()=>handleShareClick(s)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'11px',padding:'0',letterSpacing:'1px'}}>
            {sharing===s.id?'...':'↗ SHARE'}
          </button>
          {!isBoosted && (
            <button onClick={()=>triggerCheckout('boost', s.id)} style={{background:'none',border:'none',color:'#665533',cursor:'pointer',fontSize:'11px',padding:'0',letterSpacing:'1px',fontWeight:'bold'}}>
              ⚡ BOOST
            </button>
          )}
          {featured && <button onClick={showRandom} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>{T.next}</button>}
        </div>

        {aloneToast && aloneToast.id === s.id && (
          <p style={{ fontSize: 13, color: accent, marginTop: 10, fontStyle: 'italic', animation: 'sb-fade-in 0.3s ease' }}>
            {T.youAreNotAlone.replace('{n}', String(aloneToast.n))}
          </p>
        )}

        {showComments.has(s.id) && (
          <div style={{marginTop:'16px',borderTop:`1px solid ${dim}`,paddingTop:'16px'}}>
            {(comments[s.id]||[]).map(c => (
              <p key={c.id} style={{fontSize:'13px',color:'#777',margin:'0 0 8px 0',fontStyle:'italic'}}>&ldquo;{c.content}&rdquo;</p>
            ))}
            <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
              <input value={commentInput[s.id]||''} onChange={e=>setCommentInput(prev=>({...prev,[s.id]:e.target.value.slice(0,80)}))} onKeyDown={e=>{ if(e.key==='Enter') submitComment(s.id); }} placeholder="leave a whisper..." style={{flex:1,background:bg,color:'#e8e8e8',border:'1px solid #222',padding:'8px 12px',fontSize:'12px',fontFamily:'Georgia,serif'}} />
              <button onClick={()=>submitComment(s.id)} disabled={commentLoading===s.id} style={{background:'none',border:'1px solid #333',color:'#666',padding:'8px 12px',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>{commentLoading===s.id?'...':'SEND'}</button>
            </div>
            {commentError[s.id] && <p style={{fontSize:'11px',color:'#c88',marginTop:'8px',lineHeight:'1.5'}}>{commentError[s.id]}</p>}
            <p style={{fontSize:'10px',color:'#2a2a2a',marginTop:'4px'}}>{(commentInput[s.id]||'').length}/80</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    {TURNSTILE_SITE_KEY && (
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
    )}
    <style>{`@keyframes sb-fade-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    <HiveInstallHint />
    <AutoDemo />
    <FirstVisitCard />
    <main style={{background:bg,minHeight:'100vh',color:'#e8e8e8',fontFamily:'Georgia,serif',maxWidth:'600px',margin:'0 auto',padding:'24px 16px',transition:'background 1s'}}>
      {boostedSuccess && (
        <div style={{ background: 'rgba(212,175,55,0.15)', border: `1px solid ${accent}`, color: accent, padding: '12px', marginBottom: '24px', fontSize: '13px', textAlign: 'center', letterSpacing: '1px', animation: 'sb-fade-in 0.3s ease' }}>
          ✦ CONFESSION BOOSTED! IT HAS BEEN FEATURED AT THE TOP OF THE FEED.
        </div>
      )}

      {sharePreview && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <p style={{fontSize:'12px',color:'#666',letterSpacing:'2px',marginBottom:'16px'}}>PREVIEW</p>
          <img src={sharePreview.url} alt="share preview" style={{maxWidth:'100%',maxHeight:'60vh',objectFit:'contain',border:`1px solid ${accent}`}} />
          <div style={{display:'flex',gap:'12px',marginTop:'24px',flexWrap:'wrap',justifyContent:'center'}}>
            <button onClick={nativeShare} style={{background:accent,color:'#0a0a0a',border:'none',padding:'12px 28px',fontSize:'12px',letterSpacing:'2px',cursor:'pointer'}}>SHARE</button>
            <button onClick={downloadShare} style={{background:'transparent',border:`1px solid ${accent}`,color:accent,padding:'12px 28px',fontSize:'12px',letterSpacing:'2px',cursor:'pointer'}}>DOWNLOAD</button>
            <button onClick={()=>setSharePreview(null)} style={{background:'transparent',border:'1px solid #333',color:'#666',padding:'12px 28px',fontSize:'12px',letterSpacing:'2px',cursor:'pointer'}}>CANCEL</button>
          </div>
        </div>
      )}

      {newCount > 0 && (
        <div onClick={loadNewSecrets} style={{position:'fixed',top:'12px',left:'50%',transform:'translateX(-50%)',background:accent,color:'#0a0a0a',padding:'8px 20px',fontSize:'12px',letterSpacing:'2px',cursor:'pointer',zIndex:100,boxShadow:'0 2px 12px rgba(0,0,0,0.5)'}}>
          {newCount} {T.newSecrets}
        </div>
      )}

      {nightMode && (
        <div style={{textAlign:'center',marginBottom:'8px'}}>
          <p style={{fontSize:'11px',color:'#9b7fa6',letterSpacing:'3px'}}>3AM MODE</p>
        </div>
      )}

      <div style={{textAlign:'center',marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'center',gap:'6px',marginBottom:'16px',flexWrap:'wrap'}}>
          {LANGS.map(l => (
            <button key={l.code} onClick={()=>setLang(l.code)} style={{background: lang===l.code?accent:'transparent',color: lang===l.code?'#0a0a0a':'#555',border:`1px solid ${lang===l.code?accent:'#333'}`,padding:'4px 12px',cursor:'pointer',fontSize:'11px',letterSpacing:'2px',fontWeight: lang===l.code?'bold':'normal',transition:'all 0.2s'}}>{l.label}</button>
          ))}
        </div>
        <h1 style={{fontSize:'28px',fontWeight:'300',letterSpacing:'4px',color:accent}}>{T.title}</h1>
        <p style={{fontSize:'13px',color:'#666',marginTop:'8px'}}>{T.tagline}</p>
        <HiveFirstVisitExplainer />
        <div style={{marginTop:'12px',display:'flex',justifyContent:'center',gap:'24px',flexWrap:'wrap'}}>
          {totalSecrets > 0 && <p style={{fontSize:'12px',color:'#444',letterSpacing:'1px'}}>{totalSecrets.toLocaleString()} {T.secretsShared}</p>}
          {totalMeToo > 0 && <p style={{fontSize:'12px',color:'#444',letterSpacing:'1px'}}>{totalMeToo.toLocaleString()} {T.peopleSaidMeToo}</p>}
          {activeCount > 0 && <p style={{fontSize:'12px',letterSpacing:'1px',color: pulse?accent:'#333',transition:'color 0.5s'}}>● {activeCount} {T.activeNow}</p>}
        </div>
      </div>

      <div style={{display:'flex',gap:'12px',marginBottom:'24px',justifyContent:'center'}}>
        <button onClick={()=>{setView('feed');setRandom(null);dismissFirstVisit();}} style={{background: view==='feed'?accent:'transparent',color: view==='feed'?'#0a0a0a':accent,border:`1px solid ${accent}`,padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>{T.read}</button>
        <button onClick={()=>{setView('submit');dismissFirstVisit();}} style={{background: view==='submit'||view==='followup'?accent:'transparent',color: view==='submit'||view==='followup'?'#0a0a0a':accent,border:`1px solid ${accent}`,padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>{T.share}</button>
        <a href="/daily" style={{background:'transparent',color:'#888',border:'1px solid #333',padding:'8px 16px',letterSpacing:'2px',fontSize:'12px',textDecoration:'none'}}>{T.dailyLink}</a>
      </div>

      {pending.length > 0 && (
        <div style={{ border: `1px dashed ${accent}`, padding: 14, marginBottom: 24, opacity: 0.85 }}>
          <p style={{ fontSize: 11, color: accent, letterSpacing: 2, margin: '0 0 6px 0' }}>{T.pendingTitle}</p>
          <p style={{ fontSize: 11, color: '#666', margin: '0 0 10px 0' }}>{T.pendingHelp}</p>
          {pending.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>&ldquo;{p.content.slice(0, 60)}{p.content.length > 60 ? '…' : ''}&rdquo;</span>
              <span style={{ fontSize: 11, color: '#666', marginRight: 8 }}>{timeUntil(p.scheduled_release_at)}</span>
              <button onClick={()=>cancelPending(p.id)} style={{ background: 'transparent', border: '1px solid #444', color: '#888', fontSize: 10, letterSpacing: 1, padding: '3px 8px', cursor: 'pointer' }}>{T.cancel}</button>
            </div>
          ))}
        </div>
      )}

      {view === 'feed' && (
        <div>
          {secretOfDay && (
            <div style={{marginBottom:'32px'}}>
              <p style={{fontSize:'11px',color:accent,letterSpacing:'3px',marginBottom:'12px',textAlign:'center'}}>✦ SECRET OF THE DAY</p>
              <SecretCard s={secretOfDay} featured={true} />
            </div>
          )}
          {mostFelt && mostFelt.id !== secretOfDay?.id && (
            <div style={{marginBottom:'32px'}}>
              <p style={{fontSize:'11px',color:accent,letterSpacing:'3px',marginBottom:'12px',textAlign:'center'}}>{T.mostFelt}</p>
              <SecretCard s={mostFelt} featured={true} />
            </div>
          )}
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <button onClick={showRandom} style={{background:'#111',border:`1px solid ${accent}`,color:accent,padding:'10px 28px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px'}}>{T.showTruth}</button>
          </div>
          {random && <SecretCard s={random} featured={true} label="SOMEONE'S TRUTH" />}
          <div style={{display:'flex',gap:'6px',marginBottom:'24px',flexWrap:'wrap',justifyContent:'center'}}>
            {FILTERS.map(c => (
              <button key={c} onClick={()=>{setFilter(c);setVisibleCount(10);}} style={{background: filter===c?accent:'transparent',color: filter===c?'#0a0a0a':'#555',border:'1px solid #222',padding:'4px 12px',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>{c === 'all' ? T.all : c.toUpperCase()}</button>
            ))}
          </div>
          {visibleSecrets.length === 0 && <p style={{textAlign:'center',color:'#444',fontSize:'14px'}}>{T.nothingHere}</p>}
          {visibleSecrets.map(s => <SecretCard key={s.id} s={s} />)}
          {visibleCount < filtered.length && <div ref={loadMoreRef} style={{height:'40px'}} />}

          <div style={{textAlign:'center',marginTop:'48px',paddingTop:'32px',borderTop:'1px solid #111'}}>
            <p style={{fontSize:'12px',color:'#333',marginBottom:'16px',lineHeight:'1.8'}}>this app is free, forever.<br/><span style={{color:'#2a2a2a'}}>if it helped you, you can support it.</span></p>
            <div style={{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>triggerCheckout('plus')} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#444',padding:'8px 16px',fontSize:'11px',letterSpacing:'1px',cursor:'pointer'}}>$1.99 / mo</button>
              <button onClick={()=>triggerCheckout('pro')} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#444',padding:'8px 16px',fontSize:'11px',letterSpacing:'1px',cursor:'pointer'}}>$19 / yr</button>
              <button onClick={()=>window.open('https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02','_blank')} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#444',padding:'8px 16px',fontSize:'11px',letterSpacing:'1px',cursor:'pointer'}}>$5 once</button>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => sound.setEnabled(!sound.enabled)} style={{ background: 'transparent', border: '1px solid #222', color: sound.enabled ? accent : '#444', padding: '6px 14px', fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>
                {sound.enabled ? '♪ SOUND ON' : '♪ SOUND OFF'}
              </button>
              <a href={`/art/${new Date().toISOString().slice(0, 7)}`} style={{ color: '#666', fontSize: 11, letterSpacing: 1, textDecoration: 'none', border: '1px solid #222', padding: '6px 14px' }}>
                ✦ THIS MONTH&apos;S ART
              </a>
            </div>
          </div>
        </div>
      )}

      {view === 'submit' && !submitted && (
        <div>
          <p style={{fontSize:'14px',color:'#666',marginBottom:'28px',lineHeight:'1.8',textAlign:'center'}}>
            {T.anonymous}<br/>{T.justTruth}<br/>
            <span style={{color:'#444',fontSize:'11px'}}>{T.permanent}</span>
          </p>
          <p style={{fontSize:'13px',color:'#888',marginBottom:'16px',letterSpacing:'1px'}}>{T.howFeeling}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'24px'}}>
            {MOODS.map(m => (
              <button key={m} onClick={()=>setCategory(m)} style={{background: category===m?accent:'#111',color: category===m?'#0a0a0a':'#666',border:`1px solid ${category===m?accent:'#333'}`,padding:'8px 16px',cursor:'pointer',fontSize:'13px',letterSpacing:'1px',transition:'all 0.2s'}}>{m}</button>
            ))}
          </div>
          <div style={{position:'relative'}}>
            <textarea value={content} onChange={e=>{ setContent(e.target.value.slice(0,500)); checkPersonalInfo(e.target.value); }} onKeyDown={handleKeyDown} placeholder={ROTATING_PLACEHOLDERS[placeholderIdx] || T.placeholder} rows={6} style={{width:'100%',background:'#111',color:'#e8e8e8',border:`1px solid ${personalInfoWarning?'#c44':'#333'}`,padding:'16px',fontSize:'15px',lineHeight:'1.7',resize:'vertical',fontFamily:'Georgia,serif',boxSizing:'border-box'}} />
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
              <span style={{fontSize:'11px',color: content.length > 400 ? accent : '#333'}}>{content.length}/500</span>
              {content.length > 0 && <span style={{fontSize:'11px',color:'#333'}}>Ctrl+Enter to send</span>}
            </div>
          </div>
          {personalInfoWarning && (
            <div style={{background:'#1a0a0a',border:'1px solid #c44',padding:'12px',marginTop:'8px'}}>
              <p style={{fontSize:'12px',color:'#c88',margin:0,lineHeight:'1.6'}}>Your secret appears to contain personal information. For your safety, please remove it before sharing.</p>
            </div>
          )}

          <div style={{ marginTop: 16, padding: 14, border: '1px solid #1a1a1a', background: '#0c0c0c' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={shareCity} onChange={e => setShareCity(e.target.checked)} style={{ accentColor: accent }} />
              <span style={{ fontSize: 12, color: '#aaa', letterSpacing: 1 }}>{T.shareCityLabel}</span>
            </label>
            <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0 22px', lineHeight: 1.5 }}>{T.shareCityHelp}</p>
          </div>

          <div style={{ marginTop: 14, padding: 14, border: '1px solid #1a1a1a', background: '#0c0c0c' }}>
            <p style={{ fontSize: 11, color: '#aaa', letterSpacing: 2, margin: '0 0 8px 0' }}>{T.whenLabel}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['now','24h','7d'] as const).map(opt => (
                <button key={opt} onClick={() => setSchedule(opt)} style={{ background: schedule===opt?accent:'transparent', color: schedule===opt?'#0a0a0a':'#888', border: `1px solid ${schedule===opt?accent:'#333'}`, padding: '6px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' }}>
                  {opt === 'now' ? T.postNow : opt === '24h' ? T.post24h : T.post7d}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#555', margin: '8px 0 0 0', lineHeight: 1.5 }}>{T.scheduleHelp}</p>
          </div>

          <div style={{marginTop:'16px'}}>
            {!imagePreview && <button onClick={()=>fileRef.current?.click()} style={{background:'none',border:'1px dashed #333',color:'#555',padding:'10px 20px',cursor:'pointer',fontSize:'12px',letterSpacing:'1px',width:'100%'}}>{T.addImage}</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
            {imageUploading && <p style={{color:'#666',fontSize:'12px',marginTop:'8px',textAlign:'center'}}>{T.checkingImg}</p>}
            {imageError && <div style={{background:'#1a0a0a',border:'1px solid #c44',padding:'12px',marginTop:'8px'}}><p style={{fontSize:'12px',color:'#c88',margin:0,lineHeight:'1.6'}}>{imageError}</p></div>}
            {imagePreview && !imageUploading && !imageError && (
              <div style={{position:'relative',marginTop:'8px'}}>
                <img src={imagePreview} alt="" style={{width:'100%',maxHeight:'200px',objectFit:'cover',opacity:0.7}} />
                <button onClick={removeImage} style={{position:'absolute',top:'8px',right:'8px',background:bg,border:'1px solid #333',color:'#888',padding:'4px 8px',cursor:'pointer',fontSize:'11px'}}>{T.remove}</button>
              </div>
            )}
          </div>

          {TURNSTILE_SITE_KEY && (
            <div ref={turnstileWidgetRef} style={{ marginTop: 14, minHeight: 40 }} />
          )}

          {submitError && (
            <div style={{ background:'#1a0a0a', border:'1px solid #c44', padding:'12px', marginTop:'12px' }}>
              <p style={{ fontSize:12, color:'#c88', margin:0, lineHeight:1.6 }}>{submitError}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading||content.length<5||!category||imageUploading||personalInfoWarning} style={{marginTop:'16px',width:'100%',background: content.length>=5&&category&&!imageUploading&&!personalInfoWarning?accent:'#222',color: content.length>=5&&category&&!imageUploading&&!personalInfoWarning?'#0a0a0a':'#444',border:'none',padding:'14px',fontSize:'13px',letterSpacing:'3px',cursor: content.length>=5&&category&&!imageUploading&&!personalInfoWarning?'pointer':'default',transition:'all 0.3s'}}>
            {loading?T.sending:imageUploading?T.checkingImage:T.release}
          </button>
        </div>
      )}

      {view === 'followup' && !followupDone && (
        <div style={{textAlign:'center',padding:'32px 0'}}>
          <p style={{fontSize:'20px',color:accent,marginBottom:'16px'}}>{schedule === 'now' ? T.outThere : T.heard}</p>
          <p style={{fontSize:'14px',color:'#666',marginBottom:'32px'}}>
            {schedule === 'now' ? T.lessAlone
              : schedule === '24h' ? 'your secret will release in 24 hours. you can cancel anytime from the feed.'
              : 'your secret will release in 7 days. you can cancel anytime from the feed.'}
          </p>

          {similar.length > 0 && (
            <div style={{ background:'#0c0c0c', border:`1px solid ${accent}`, padding:'18px', marginBottom:'24px', textAlign:'left' }}>
              <p style={{ fontSize:11, color:accent, letterSpacing:2, margin:'0 0 6px 0' }}>✦ OTHERS HAVE WRITTEN ABOUT THIS TOO</p>
              <p style={{ fontSize:12, color:'#888', margin:'0 0 14px 0', fontStyle:'italic' }}>you are not alone in feeling this.</p>
              {similar.map(s => (
                <div key={s.id} style={{ borderTop:'1px solid #1a1a1a', paddingTop:12, marginTop:12 }}>
                  <p style={{ fontSize:11, color:'#444', letterSpacing:2, margin:'0 0 6px 0' }}>{s.category.toUpperCase()}{(s.me_too_count || 0) > 0 ? ` · ${s.me_too_count} ME TOO` : ''}</p>
                  <p style={{ fontSize:14, color:'#bbb', lineHeight:1.6, margin:0 }}>{s.content}</p>
                  {s.city ? <p style={{ fontSize:11, color:'#555', margin:'6px 0 0 0', fontStyle:'italic' }}>someone in {s.city}</p> : null}
                </div>
              ))}
            </div>
          )}

          <div style={{background:'#111',border:'1px solid #333',padding:'24px',textAlign:'left'}}>
            <p style={{fontSize:'14px',color:'#888',marginBottom:'16px',fontStyle:'italic'}}>{T.sayMore}</p>
            <textarea value={followupAnswer} onChange={e=>setFollowupAnswer(e.target.value.slice(0,300))} placeholder={T.morePlaceholder} rows={4} style={{width:'100%',background:bg,color:'#e8e8e8',border:'1px solid #222',padding:'12px',fontSize:'14px',lineHeight:'1.7',resize:'none',fontFamily:'Georgia,serif',boxSizing:'border-box'}} />
            <p style={{fontSize:'10px',color:'#333',marginTop:'4px',textAlign:'right'}}>{followupAnswer.length}/300</p>
            <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
              <button onClick={()=>setFollowupDone(true)} style={{flex:1,background:'none',border:'1px solid #333',color:'#666',padding:'10px',cursor:'pointer',fontSize:'12px',letterSpacing:'1px'}}>{T.noDone}</button>
              <button onClick={()=>setFollowupDone(true)} disabled={followupAnswer.length<2} style={{flex:2,background: followupAnswer.length>=2?accent:'#111',color: followupAnswer.length>=2?'#0a0a0a':'#333',border:'none',padding:'10px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px',transition:'all 0.3s'}}>{T.releaseThis}</button>
            </div>
          </div>
        </div>
      )}

      {view === 'followup' && followupDone && (
        <div style={{textAlign:'center',padding:'48px 0'}}>
          <p style={{fontSize:'20px',color:accent,marginBottom:'16px'}}>{T.heard}</p>
          <p style={{fontSize:'14px',color:'#666',marginBottom:'32px'}}>{T.courage}</p>
          <button onClick={()=>{setView('feed');setSubmitted(false);setFollowupAnswer('');setFollowupDone(false);setContent('');setCategory('');setImagePreview(null);setImageUrl(null);setPersonalInfoWarning(false);}} style={{background:'none',border:'1px solid #333',color:'#666',padding:'10px 28px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px'}}>{T.readOthers}</button>
        </div>
      )}
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
