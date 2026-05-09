// Queen Bee consumption — local wrapper around @queen-bee/client.
//
// Centralises the engineId, the fail-policy decision, and a governance-stamp
// type the rest of the engine can rely on without importing the client
// directly.
//
// Fail policy: FAIL-DEGRADED (per WIRING.md §3 + ENGINE_GRAMMAR.md
// "## Governance"). When QB is unreachable we let the response through
// with a synthesized stamp `{ governed: false, safe: true, flags: ['qb_unavailable'] }`
// rather than blocking the user. Rationale: secret-box content has
// already passed three upstream sanitizers (containsPersonalInfo on
// submit, moderateComment on comments, moderateImage on uploads), so
// QB is a defense-in-depth layer rather than the only gate. Outages of
// the governance substrate must not silently break an anonymous outlet.
//
// Future-compat: when QB starts enforcing engine tokens, add
// QB_ENGINE_TOKEN to env_vars_optional and the client picks it up
// automatically.

import {
  govern as qbGovern,
  QueenBeeUnavailableError,
  type GovernRequestContext,
  type GovernResponse,
  type GovernanceStamp,
} from './queen-bee-client';

export type { GovernanceStamp };

export const ENGINE_ID = 'secretbox';

// QB registry maps secretbox to safety: 'elevated', which (per
// queen-bee/lib/safety.ts DISCLAIMERS map) requires this exact phrase
// in every content payload. Without it, /api/govern rejects every
// call with `missing_disclaimer:elevated` and submission breaks.
// First-consumer lesson surfaced post-#12 — see secret-box#13 for
// the production-broken story and queen-bee WIRING.md amendment.
const ELEVATED_DISCLAIMER = 'This is not professional advice. Always seek qualified guidance.';

// Fallback stamp produced when QB is unreachable. Same shape as a real
// stamp so downstream consumers (DB column, response payload, audit
// queries) don't need to special-case the unavailable path.
function unavailableStamp(reason: string): GovernanceStamp {
  return {
    engine: ENGINE_ID,
    schema: 'secret-response',
    version: 'qb-unavailable',
    timestamp: new Date().toISOString(),
    language: 'en',
    safe: true,
    governed: false,
    flags: ['qb_unavailable', reason],
  };
}

// Wrapped govern() that always returns a verdict (never throws).
// Approved: { approved: true, stamp, content }.
// Rejected: { approved: false, stamp, failureCode, failureReason }.
// Unavailable: { approved: true, stamp: unavailableStamp(...), content (input passed through) } — fail-degraded.

export type Verdict =
  | {
      approved: true;
      stamp: GovernanceStamp;
      content: Record<string, unknown>;
    }
  | {
      approved: false;
      stamp?: GovernanceStamp;
      failureCode: string;
      failureReason: string;
      schemaErrors?: string[];
    };

export async function govern(args: {
  input: string;
  content: Record<string, unknown>;
  context?: GovernRequestContext;
}): Promise<Verdict> {
  // Inject the elevated-tier disclaimer into every content payload
  // before QB sees it. Single source of truth — routes pass their
  // own content shape; the wrapper guarantees the disclaimer is
  // always present.
  const stampedContent = { ...args.content, disclaimer: ELEVATED_DISCLAIMER };
  let res: GovernResponse;
  try {
    res = await qbGovern({
      engineId: ENGINE_ID,
      input: args.input,
      content: stampedContent,
      context: args.context,
    });
  } catch (err) {
    if (err instanceof QueenBeeUnavailableError) {
      // FAIL-DEGRADED — let the response through with a not-governed stamp.
      console.warn(`[qb] unavailable for ${ENGINE_ID}: ${err.message}`);
      return {
        approved: true,
        stamp: unavailableStamp(err.code),
        content: stampedContent,
      };
    }
    const e = err as Error;
    console.warn(`[qb] unexpected error for ${ENGINE_ID}: ${e.message}`);
    return {
      approved: true,
      stamp: unavailableStamp('unexpected_error'),
      content: stampedContent,
    };
  }

  if (res.approved && res.stampedContent && res.governanceStamp) {
    return { approved: true, stamp: res.governanceStamp, content: res.stampedContent };
  }
  return {
    approved: false,
    stamp: res.governanceStamp,
    failureCode: res.failureCode || 'unknown',
    failureReason: res.failureReason || 'Queen Bee rejected the response.',
    schemaErrors: res.schemaErrors,
  };
}
