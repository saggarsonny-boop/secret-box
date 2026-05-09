import { getDb } from './db';

const DAILY_CAP_CENTS = 500;

export async function isOverCap(vendor: string = 'anthropic'): Promise<boolean> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT cents FROM cost_ledger WHERE day = CURRENT_DATE AND vendor = ${vendor}`;
    if (!rows.length) return false;
    return (rows[0] as { cents: number }).cents >= DAILY_CAP_CENTS;
  } catch {
    return false;
  }
}

export async function recordSpend(cents: number, vendor: string = 'anthropic'): Promise<void> {
  if (cents <= 0) return;
  try {
    const sql = getDb();
    await sql`
      INSERT INTO cost_ledger (day, vendor, cents)
      VALUES (CURRENT_DATE, ${vendor}, ${cents})
      ON CONFLICT (day, vendor) DO UPDATE SET cents = cost_ledger.cents + ${cents}
    `;
  } catch {
    // Silent — cost ledger is observability, not a gate.
  }
}

// Rough Anthropic Haiku 4.5 pricing as of 2026-05.
// Input: $1/M, Output: $5/M. Conservative round-up to whole cents.
export function estimateAnthropicCents(promptTokens: number, completionTokens: number): number {
  const inputCents = (promptTokens / 1_000_000) * 100;
  const outputCents = (completionTokens / 1_000_000) * 500;
  return Math.max(1, Math.ceil(inputCents + outputCents));
}
