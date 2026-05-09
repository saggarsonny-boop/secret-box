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
