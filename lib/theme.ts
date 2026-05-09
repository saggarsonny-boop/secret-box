// Emotional-theme classifier for incoming secrets.
// Uses Claude Haiku 4.5 with the cost-cap circuit breaker. Returns one
// of THEMES on success or null on failure / over-cap. Never throws.

import { isOverCap, recordSpend, estimateAnthropicCents } from './cost-cap';

export const THEMES = [
  'grief', 'fear', 'hope', 'longing', 'anger',
  'shame', 'relief', 'joy', 'loneliness', 'regret',
] as const;
export type Theme = typeof THEMES[number];

const THEME_SET = new Set<string>(THEMES);

export async function classifyTheme(content: string): Promise<Theme | null> {
  if (await isOverCap('anthropic')) return null;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8,
        messages: [{
          role: 'user',
          content: `Classify the emotional theme of this anonymous secret as exactly ONE word from this list: ${THEMES.join(', ')}.\n\nSecret: "${content}"\n\nReply with only the word, lowercase, no punctuation.`
        }]
      })
    });
    const data = await res.json() as { content?: { text: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    if (data.usage) {
      await recordSpend(estimateAnthropicCents(data.usage.input_tokens, data.usage.output_tokens));
    }
    const raw = data.content?.[0]?.text?.trim().toLowerCase().replace(/[^a-z]/g, '') || '';
    return THEME_SET.has(raw) ? (raw as Theme) : null;
  } catch {
    return null;
  }
}
