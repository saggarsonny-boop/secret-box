'use client';
import { useEffect, useState } from 'react';

// Lightweight inline install hint per HIVE_CONSTITUTION §V.
// Displays a one-line "Add to Home Screen" banner on first visit.
// Auto-hides when running standalone, when dismissed, or when appinstalled
// fires. Dismissal persists under hive_install_hint_dismissed_secretbox.

const KEY = 'hive_install_hint_dismissed_secretbox';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function HiveInstallHint({ message }: { message?: string }) {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(KEY) === '1') return;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    setVisible(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(KEY, '1');
      setVisible(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') localStorage.setItem(KEY, '1');
    setDeferred(null);
    setVisible(false);
  };

  const text = message || 'Add HiveSecretBox to your home screen for one-tap access.';

  return (
    <div role="region" aria-label="Add HiveSecretBox to your home screen" style={{
      background: 'rgba(212,175,55,0.06)',
      borderBottom: '1px solid rgba(212,175,55,0.2)',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }}>
      <p style={{ fontSize: 12, color: '#9a9588', margin: 0, lineHeight: 1.5, flex: 1 }}>{text}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {deferred && (
          <button onClick={install} style={{ background: '#D4AF37', color: '#0a0a0a', border: 'none', padding: '4px 10px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', borderRadius: 4 }}>ADD</button>
        )}
        <button onClick={dismiss} aria-label="Dismiss install hint" style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
      </div>
    </div>
  );
}
