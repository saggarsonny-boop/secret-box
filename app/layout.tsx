import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: "HiveSecretBox — Say the thing you haven't said.",
  description: 'Anonymous secrets. No account, no IP storage, no tracking. A private place for the truths you cannot say out loud.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  appleWebApp: {
    capable: true,
    title: 'HiveSecretBox',
    statusBarStyle: 'black-translucent'
  },
  openGraph: {
    title: 'HiveSecretBox — you are not alone',
    description: 'Anonymous secrets. No account, no IP storage, no tracking.',
    url: 'https://secretbox.hive.baby',
    siteName: 'HiveSecretBox',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website'
  }
};

export const viewport: Viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1
};

const NAV_STYLE: React.CSSProperties = { fontSize: '11px', color: 'rgba(180,200,225,0.55)', textDecoration: 'none' };
const DOT: React.CSSProperties = { color: 'rgba(26,58,92,0.5)', fontSize: '11px' };

function HiveNav() {
  return (
    <header style={{ borderBottom: '1px solid rgba(13,31,53,0.7)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,4,8,0.6)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <a href="https://hive.baby" target="_blank" rel="noopener" aria-label="Hive ecosystem" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/hive-logo-full.png" alt="Hive ecosystem" style={{ height: 32, width: 'auto' }} />
      </a>
      <nav style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <a href="/daily" style={{ ...NAV_STYLE, color: '#D4AF37' }}>✦ DAILY</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/about" style={NAV_STYLE}>About</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/patrons" style={NAV_STYLE}>Patrons</a>
      </nav>
    </header>
  );
}

function HiveFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(13,31,53,0.8)', padding: '20px 24px 28px', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', color: 'rgba(154,149,136,0.7)', marginBottom: '10px', letterSpacing: '0.05em' }}>
        No ads. No investors. No agenda.
      </p>
      <p style={{ fontSize: '11px', color: 'rgba(154,149,136,0.55)', marginBottom: '14px', letterSpacing: '0.04em' }}>
        Anonymous by design. No accounts, no IP storage, no tracking.
      </p>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <a href="https://hive.baby" style={NAV_STYLE}>hive.baby</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/social-experiment" style={NAV_STYLE}>social experiment</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/contribute" style={NAV_STYLE}>contribute</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/patrons" style={NAV_STYLE}>patronage</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/privacy" style={NAV_STYLE}>privacy</a>
      </div>
      <p style={{ fontSize: 11, color: '#9a9588', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <img src="/hive-mark.svg" alt="" aria-hidden style={{ height: 18, width: 'auto' }} />
        Made with <span style={{ color: '#D4AF37' }}>♥</span> in the <a href="https://hive.baby" target="_blank" rel="noopener" style={{ color: '#9a9588', textDecoration: 'none', borderBottom: '1px dotted #9a9588' }}>Hive</a>
      </p>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <HiveNav />
        {children}
        <HiveFooter />
        <Analytics />
        <Script id="register-sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
      
{/* Stripe Checkout Block */}
<div id="stripe-checkout-cta" style={{ margin: '2rem auto', padding: '2.5rem', borderRadius: '16px', background: 'rgba(22, 26, 33, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', textAlign: 'center', fontFamily: 'Outfit, sans-serif', maxWidth: '600px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
    <h3 style={{ marginTop: 0, color: '#fff' }}>Activate Premium License</h3>
    <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: '#D4AF37', color: '#000000', fontWeight: '800', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '0.5px' }}>Unlock Now</a>
</div>

</body>
    </html>
  );
}
