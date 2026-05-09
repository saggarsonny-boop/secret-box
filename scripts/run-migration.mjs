#!/usr/bin/env node
// One-shot migration runner that doesn't require psql on the host.
// Reads migrations/001_virality.sql and executes each statement against
// $DATABASE_URL via the Neon serverless driver. Idempotent SQL — safe
// to re-run.

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = neon(url);
const file = process.argv[2] || 'migrations/001_virality.sql';
const raw = readFileSync(file, 'utf8');

// Strip line comments, then split on `;` at end of line. The migration
// SQL has no string-literal semicolons, so a naive split is safe here.
const stripped = raw.split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
const statements = stripped.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);

let ok = 0, fail = 0;
for (const stmt of statements) {
  try {
    await sql(stmt);
    const summary = stmt.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`OK  ${summary}${stmt.length > 80 ? '…' : ''}`);
    ok++;
  } catch (e) {
    console.error(`ERR ${stmt.slice(0, 80)}…`);
    console.error(`    ${e.message}`);
    fail++;
  }
}

console.log(`\n${ok} statement(s) ok, ${fail} failed.`);
process.exit(fail ? 1 : 0);
