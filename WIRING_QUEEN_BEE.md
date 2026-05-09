# HiveSecretBox — Queen Bee wiring (canonical worked example)

> Companion to [`@queen-bee/client/WIRING.md`](https://github.com/saggarsonny-boop/queen-bee/blob/main/packages/queen-bee-client/WIRING.md). HiveSecretBox is the **first Hive engine to consume Queen Bee in production** (2026-05-09). This document captures the actual decisions taken so the next engine doesn't have to reinvent them.

## TL;DR

- **engineId**: `secretbox` (matches `queen-bee/lib/registry.ts`).
- **schema**: `secret-response` (required fields `received`, `resonance`).
- **safety tier**: `elevated`.
- **fail policy**: **fail-degraded** — surface content with `governed: false` stamp on QB outage; never block an anonymous outlet on substrate availability.
- **routes wired**: `POST /api/secrets`, `POST /api/comments`, `GET /api/daily`, `POST /api/ai-image`.
- **DB**: `governance_stamp JSONB` column on `secrets`, `comments`, `monthly_art` (migration `003_qb_consumption.sql`).
- **Wrapper**: `lib/governance.ts` centralises the engineId + fail policy. Routes import a single `govern()` from the wrapper, not the QB client directly.

## What was already done before this PR

1. **Registry**: `secretbox` was already registered in `queen-bee/lib/registry.ts` with `schema: 'secret-response'`, `safety: 'elevated'`. No queen-bee PR needed in step 1.
2. **Schema**: `secret-response` was already in `lib/schemas.ts` with required fields `['received', 'resonance']`. No schema gap (unlike HivePlainScan, which still needs `radiology-report-explanation`).

## Decisions per WIRING.md step

### Step 2 — install (with caveat)
**WIRING.md §2 instructs `"@queen-bee/client": "github:saggarsonny-boop/queen-bee#main"` — this does not currently resolve.** The QB repo's root `package.json` is named `queen-bee` (not `@queen-bee/client`) and `dist/` is built at publish-time, not committed to `main`. The github tarball install ends up at the wrong package name with no compiled output. The published-npm path doesn't exist either (`private: true, publishConfig.access: restricted`).

**Worked-around** by inlining a minimal HTTP client at `lib/queen-bee-client.ts`. It mirrors the canonical SDK's public surface (`govern`, `GovernRequest`, `GovernResponse`, `GovernanceStamp`, `QueenBeeUnavailableError`) closely enough that swapping to the published SDK later is a one-import change in `lib/governance.ts`. Intentional simplifications: no retry on 5xx (single attempt; `QueenBeeUnavailableError` on first transport failure), no `onTransportFailure` hook (`console.warn` instead).

Filed as a queen-bee follow-up issue: the SDK needs a real install path before any *next* engine can do this cleanly.

### Step 3 — fail policy: **fail-degraded**
Three upstream sanitizers run before content ever reaches QB:
- `containsPersonalInfo` regex on every secret
- `moderateComment` Anthropic-Haiku safety check on every comment
- `moderateImage` Anthropic-Haiku safety check on every image upload

QB is therefore a *defense-in-depth* layer rather than the only gate. Fail-closed would mean a QB outage takes the entire anonymous outlet offline, which is worse for users than letting through content that's already passed three filters. Fail-open would lose the audit signal. Fail-degraded threads the needle: content gets through with a visible `governed: false` stamp + `flags: ['qb_unavailable']`, downstream observers can see what happened.

The decision lives in `lib/governance.ts`'s `unavailableStamp()` synthesizer.

### Step 4 — wiring shape
All routes import from a single local wrapper rather than the in-repo client directly:

```ts
// lib/governance.ts
import { govern as qbGovern, QueenBeeUnavailableError, /* … */ } from './queen-bee-client';
export const ENGINE_ID = 'secretbox';
export async function govern(args: { input, content, context }): Promise<Verdict> {
  try {
    const res = await qbGovern({ engineId: ENGINE_ID, ...args });
    // map to local Verdict shape …
  } catch (err) {
    if (err instanceof QueenBeeUnavailableError) {
      return { approved: true, stamp: unavailableStamp(err.code), content: args.content };
    }
    throw err;
  }
}
```

Why a wrapper:
- Single place to change the fail policy if the engine evolves.
- Routes never reference the QB client directly, so a future SDK swap (or moving from the in-repo `lib/queen-bee-client.ts` to the canonical `@queen-bee/client` once it's installable) is a one-import change.
- `Verdict` returns the same shape on success and on QB-unavailable, so route code is the same on both paths.

### Step 4 — content shapes per route

The registry maps `secretbox` to ONE schema (`secret-response`, required `{received, resonance}`). Different routes mean different "natural" shapes — the wrapper handles this by passing a minimal envelope to QB while the engine's own response stays whatever it was:

| Route | QB content (sent for governance) | Engine response (returned to caller) |
|---|---|---|
| `POST /api/secrets` | `{ received: true, resonance: 0 }` | full secret row + `_governance: stamp` |
| `POST /api/comments` | `{ received: true, resonance: 0 }` | comment row + `_governance: stamp` |
| `GET /api/daily` | `{ received: true, resonance: <sum of me_too across drop> }` | `{ date, secrets, curated, _governance: stamp }` |
| `POST /api/ai-image` | `{ received: true, resonance: 0 }` | `{ ai_image_url, _governance: stamp }` |

**Lesson learned**: the registry's one-engine-one-schema constraint means you can't naturally vary content per route. Either pick a schema that fits all routes (what we did — `secret-response` is permissive enough that `received: true` covers every "we accepted this" path), or split your engine into multiple registry entries (heavier).

### Step 5 — onTransportFailure
Not wired. HiveSecretBox does not yet adopt the `hive_alerts` substrate. When that ships engine-wide, the `onTransportFailure` hook in `lib/governance.ts` is one line:

```ts
const res = await qbGovern({
  engineId: ENGINE_ID,
  input: args.input,
  content: args.content,
  context: args.context,
}, {
  onTransportFailure: (err, ctx) => emitAlert('queen_bee_unavailable', { tier: 2, payload: ctx }),
});
```

Tracked as a follow-up.

### Step 6 — env vars
Added `QUEEN_BEE_URL` and `QB_ENGINE_TOKEN` to `env_vars_optional` in `ENGINE_GRAMMAR.md`. Both are optional; the client defaults to `https://queenbee.hive.baby` and skips the auth header when the token is absent. No Vercel env changes needed today; no operator follow-up gates the merge.

### Step 7 — tests
The pre-existing `scripts/test-no-identity.mjs` continues to run on PR. No new test file added in this PR — the wrapper is thin, and a real QB integration test belongs in queen-bee's CI rather than every consumer's. (Not a hard rule — the next engine's PR may want a wiring unit test.)

### Step 8 — `## Governance` section
Added to `ENGINE_GRAMMAR.md` under Safety Templates. Format mirrors WIRING.md §8 verbatim.

### Step 10 — tell the next engine
This file. Plus a queen-bee PR amending `WIRING.md` to flip the "no Hive engine consumes Queen Bee in production yet" notice to point at HiveSecretBox as the first consumer (HivePlainScan stays planned).

## DB column

Migration `003_qb_consumption.sql` adds `governance_stamp JSONB` to three tables:

```sql
ALTER TABLE secrets       ADD COLUMN IF NOT EXISTS governance_stamp JSONB;
ALTER TABLE comments      ADD COLUMN IF NOT EXISTS governance_stamp JSONB;
ALTER TABLE monthly_art   ADD COLUMN IF NOT EXISTS governance_stamp JSONB;

CREATE INDEX IF NOT EXISTS idx_secrets_governed
  ON secrets ((governance_stamp->>'governed'))
  WHERE governance_stamp IS NOT NULL;
```

Rationale: persisting the stamp alongside the row that triggered it lets future audit queries answer questions like *"how many rows in the past 30 days flew with `governed: false`?"* without re-running grappler.

## What's NOT wired (and why)

| Route | Status | Reason |
|---|---|---|
| `POST /api/me-too` | not wired | Atomic counter increment; no new content. The original secret already has a stamp from `POST /api/secrets`. |
| `POST /api/resonate` | not wired | Same as me-too — counter-only. |
| `GET /api/secrets-pending` | not wired | Returns rows the session already submitted (and that already have stamps from `POST /api/secrets`). |
| `GET /api/secrets`, `/api/secretofday`, `/api/mostfelt`, `/api/similar` | not wired | Read-path projections of already-governed rows. The stamp is preserved on the row but isn't re-run on every read. |
| `POST /api/daily/curate`, `/api/publish-queue`, `/api/monthly-art/curate` | not wired | Internal cron endpoints, not exposed to users. |

The principle: **govern content once at write time**, not on every read. This avoids re-running grappler tens of times per pageview and keeps QB's load proportional to write traffic, not read traffic.

## Smoke test plan

1. `POST /api/secrets` with safe content → 200, response includes `_governance: { engine: 'secretbox', schema: 'secret-response', governed: true, … }`. DB row has `governance_stamp` populated.
2. `POST /api/comments` on existing secret → 200, response includes `_governance` stamp. DB row has stamp.
3. `GET /api/daily` → 200, response wraps secrets array + includes `_governance` stamp at top level.
4. Set `QUEEN_BEE_URL=https://nonexistent.example` env on a preview deployment → submit a secret → still 200, `_governance.governed = false`, `_governance.flags = ['qb_unavailable', …]`. Fail-degraded confirmed.

## Schema gap notes (for the next engine)

If your engine's natural response doesn't fit any of QB's 15 canonical schemas, **add the schema first** in a queen-bee PR before wiring. HivePlainScan is the worked example: it needs `radiology-report-explanation`, that schema doesn't exist yet, so HivePlainScan can't wire `govern()` until queen-bee/lib/schemas.ts adds it.

HiveSecretBox got lucky — `secret-response` already existed. Don't assume your engine will be as lucky.
