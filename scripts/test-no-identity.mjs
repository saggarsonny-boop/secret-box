#!/usr/bin/env node
// Unit test for lib/safety.ts assertNoIdentity().
// Self-contained — no test framework. Exits non-zero on failure.
//
// Run: `node scripts/test-no-identity.mjs`
// CI:  `.github/workflows/secret-box-no-identity.yml` (added in this PR).

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const safetyPath = path.resolve(here, '..', 'lib', 'safety.ts');

// Strip the TypeScript types — the file is small and uses no type-only
// runtime features beyond the export annotations. This keeps the test
// dependency-free (no tsx, no esbuild).
const tsSource = readFileSync(safetyPath, 'utf8');
const jsSource = tsSource
  .replace(/^export const /gm, 'const ')
  .replace(/ as const;/g, ';')
  .replace(/^export function ([\w]+)<T>\(value: T, seen: WeakSet<object> = new WeakSet\(\)\): T \{/m,
           'function $1(value, seen = new WeakSet()) {')
  .replace(/value as unknown as object/g, 'value')
  .replace(/\(obj as Record<string, unknown>\)/g, 'obj');

const mod = await import(`data:text/javascript,${encodeURIComponent(jsSource)}\nexport { assertNoIdentity, PUBLIC_SECRET_COLUMNS, PUBLIC_COMMENT_COLUMNS };`);
const { assertNoIdentity, PUBLIC_SECRET_COLUMNS, PUBLIC_COMMENT_COLUMNS } = mod;

let failed = 0;
function assert(label, cond, detail = '') {
  if (cond) {
    console.log(`PASS ${label}`);
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// 1. Strips session_token from a flat object.
{
  const o = { id: 1, content: 'x', session_token: 'abc' };
  assertNoIdentity(o);
  assert('flat object: session_token stripped', !('session_token' in o));
  assert('flat object: content preserved', o.content === 'x');
}

// 2. Strips session_token from each row of an array.
{
  const arr = [
    { id: 1, session_token: 'a' },
    { id: 2, session_token: 'b' },
    { id: 3 },
  ];
  assertNoIdentity(arr);
  assert('array: no session_token in any row', arr.every(r => !('session_token' in r)));
  assert('array: ids preserved', arr.map(r => r.id).join(',') === '1,2,3');
}

// 3. Strips ip_hash, ip, remote_ip, remote_addr, user_id, fingerprint, device_id.
{
  const o = {
    id: 1,
    ip: '1.2.3.4',
    ip_hash: 'sha256:…',
    remote_ip: '1.2.3.4',
    remote_addr: '1.2.3.4',
    user_id: 'u1',
    fingerprint: 'fp',
    device_id: 'd1',
    session_token: 's',
  };
  assertNoIdentity(o);
  for (const k of ['ip', 'ip_hash', 'remote_ip', 'remote_addr', 'user_id', 'fingerprint', 'device_id', 'session_token']) {
    assert(`identity blocklist: ${k} stripped`, !(k in o));
  }
}

// 4. Walks nested objects (e.g. { date, secrets: [...] } from /api/daily).
{
  const o = {
    date: '2026-05-09',
    secrets: [
      { id: 1, content: 'a', session_token: 's1' },
      { id: 2, content: 'b', session_token: 's2' },
    ],
    curated: true,
  };
  assertNoIdentity(o);
  assert('nested: no session_token in any nested row', o.secrets.every(s => !('session_token' in s)));
  assert('nested: parent fields preserved', o.date === '2026-05-09' && o.curated === true);
}

// 5. Cycles do not infinite-loop.
{
  const o = { id: 1, session_token: 's' };
  o.self = o;
  try {
    assertNoIdentity(o);
    assert('cycle: completes without throwing', !('session_token' in o));
  } catch (e) {
    assert('cycle: completes without throwing', false, String(e));
  }
}

// 6. Primitives pass through unchanged.
{
  assert('primitive: number passes through', assertNoIdentity(42) === 42);
  assert('primitive: string passes through', assertNoIdentity('x') === 'x');
  assert('primitive: null passes through', assertNoIdentity(null) === null);
  assert('primitive: undefined passes through', assertNoIdentity(undefined) === undefined);
}

// 7. Public column lists must not include any blocklist key.
{
  const blocklist = ['session_token', 'ip_hash', 'ip', 'remote_ip', 'remote_addr', 'user_id', 'fingerprint', 'device_id'];
  for (const col of PUBLIC_SECRET_COLUMNS) {
    assert(`PUBLIC_SECRET_COLUMNS: ${col} not in blocklist`, !blocklist.includes(col));
  }
  for (const col of PUBLIC_COMMENT_COLUMNS) {
    assert(`PUBLIC_COMMENT_COLUMNS: ${col} not in blocklist`, !blocklist.includes(col));
  }
}

console.log(`\n${failed === 0 ? 'OK' : 'FAIL'} — ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
