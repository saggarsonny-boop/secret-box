// Locale loader. Detects the user's language from navigator.language on
// first mount, falls back to English if the detected lang isn't one of
// the seven canonical free-tier locales.

import { t, type Lang } from './translations';

const SUPPORTED: readonly Lang[] = ['en', 'es', 'pt', 'fr', 'ar', 'hi', 'zh'] as const;

export function getDefaultLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const raw = (navigator.language || 'en').toLowerCase();
  const short = raw.split('-')[0] as Lang;
  return SUPPORTED.includes(short) ? short : 'en';
}

export { t, type Lang };
