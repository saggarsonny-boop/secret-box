// Minimal in-repo Queen Bee client.
//
// Why in-repo and not @queen-bee/client: as of 2026-05-09 the canonical
// client package isn't installable from npm or via `github:` URL — the
// QB repo's root package.json is named `queen-bee` (not `@queen-bee/client`)
// and `dist/` is built at publish-time, not committed. WIRING.md §2 suggests
// the github tarball form but it doesn't currently resolve. Tracked in a
// queen-bee follow-up issue.
//
// This file mirrors the public surface of the SDK (govern, GovernRequest,
// GovernResponse, GovernanceStamp, QueenBeeUnavailableError) closely
// enough that swapping in the published SDK later is a one-import change
// in lib/governance.ts.
//
// Intentional simplifications versus the canonical SDK:
//   - No retry on 5xx (single attempt; QueenBeeUnavailableError on the first
//     transport failure or 5xx). Adequate for fail-degraded policy where
//     unavailability is handled gracefully anyway.
//   - No onTransportFailure hook. console.warn is sufficient for v0.1.

const DEFAULT_BASE_URL = 'https://queenbee.hive.baby';
const DEFAULT_TIMEOUT_MS = 10_000;
const PATH = '/api/govern';

export type SchemaType =
  | 'time-response' | 'clarity-response' | 'scenario-response' | 'coaching-response'
  | 'health-log-response' | 'governance-response' | 'moon-response' | 'lookup-response'
  | 'builder-response' | 'conversion-response' | 'reader-response' | 'creator-response'
  | 'validator-response' | 'secret-response' | 'generic';

export type Tier = 'free' | 'plus' | 'pro' | 'operator';

export interface GovernRequestContext {
  tier?: Tier;
  locale?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface GovernRequest {
  engineId: string;
  input: string;
  content: Record<string, unknown>;
  context?: GovernRequestContext;
}

export interface GovernanceStamp {
  engine: string;
  schema: SchemaType | string;
  version: string;
  timestamp: string;
  language: string;
  safe: boolean;
  governed: boolean;
  flags: string[];
}

export interface GovernResponse {
  approved: boolean;
  stampedContent?: Record<string, unknown>;
  governanceStamp?: GovernanceStamp;
  failureReason?: string;
  failureCode?: string;
  schemaErrors?: string[];
}

export class QueenBeeUnavailableError extends Error {
  readonly code = 'QUEEN_BEE_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'QueenBeeUnavailableError';
  }
}

interface QBEnvelope {
  engine: string; schema: string; version: string; timestamp: string;
  language: string; safe: boolean; governed: boolean;
  content: Record<string, unknown>; flags: string[];
}

interface QBResult {
  passed: boolean;
  envelope: QBEnvelope | null;
  errors: string[];
}

function envelopeToStamp(env: QBEnvelope): GovernanceStamp {
  return {
    engine: env.engine, schema: env.schema, version: env.version,
    timestamp: env.timestamp, language: env.language,
    safe: env.safe, governed: env.governed, flags: env.flags,
  };
}

export async function govern(req: GovernRequest): Promise<GovernResponse> {
  const baseUrl = (process.env.QUEEN_BEE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = `${baseUrl}${PATH}`;
  const token = process.env.QB_ENGINE_TOKEN;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'accept': 'application/json',
    'user-agent': 'secretbox/in-repo-qb-client',
  };
  if (token) headers['authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
      signal: controller.signal,
    });
  } catch (err) {
    throw new QueenBeeUnavailableError(`QB transport error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 500) {
    throw new QueenBeeUnavailableError(`QB returned ${res.status}`);
  }

  if (res.status === 200 || res.status === 422) {
    const result = await res.json() as QBResult;
    if (result.passed && result.envelope) {
      return {
        approved: true,
        stampedContent: result.envelope.content,
        governanceStamp: envelopeToStamp(result.envelope),
      };
    }
    const errors = result.errors ?? [];
    const safetyError = errors.find(e => e.startsWith('BLOCKED:'));
    const disclaimerError = errors.find(e => e.startsWith('missing_disclaimer:'));
    const schemaErrors = errors.filter(e => e.startsWith('missing_field:'));
    const primary = safetyError ?? disclaimerError ?? schemaErrors[0] ?? errors[0] ?? 'unknown';
    let reason: string;
    if (safetyError) reason = `Queen Bee blocked the response on a safety rule (${safetyError}).`;
    else if (disclaimerError) reason = `Queen Bee requires a safety disclaimer (${disclaimerError}).`;
    else if (schemaErrors.length > 0) reason = `Queen Bee rejected: missing required schema field(s).`;
    else reason = `Queen Bee rejected the response: ${primary}.`;
    return {
      approved: false, failureCode: primary, failureReason: reason,
      schemaErrors: schemaErrors.length > 0 ? schemaErrors : undefined,
      governanceStamp: result.envelope ? envelopeToStamp(result.envelope) : undefined,
    };
  }

  // Other 4xx — treat as business rejection so engines can render the failure.
  let body: { error?: string } = {};
  try { body = await res.json() as { error?: string }; } catch { /* noop */ }
  return {
    approved: false,
    failureCode: body.error ?? `http_${res.status}`,
    failureReason: `Queen Bee rejected the request: ${body.error ?? `HTTP ${res.status}`}.`,
  };
}
