# HiveSecretBox

> Anonymous secrets. No account, no IP storage, no tracking. A private place for the truths you cannot say out loud.

Live at **https://secretbox.hive.baby**. Part of the [Hive](https://hive.baby) ecosystem.

## What this engine is

HiveSecretBox is the anonymous-confession engine of the Hive. People share what they cannot say out loud and read what others share, without ever creating an account. Anonymity is the engine's core promise:

- No accounts, no email, no phone.
- No IP storage. Cloudflare's `cf-ipcity` header is read for the optional city display and is **never** persisted.
- No third-party analytics — no Google Analytics, Hotjar, Segment, or any tracker.
- All rate limits live in a session cookie that holds nothing personal.

## Viral mechanics

The five viral mechanics exist to amplify the cathartic core, not to capture users:

1. **Recognition button.** A "me too" tap with an ephemeral *"you are not alone — N others share this"* animation. Idempotency lives client-side in `localStorage`, never in the database, so anonymity is preserved.
2. **AI-generated imagery per secret.** Replicate FLUX schnell renders an evocative illustration for each secret (muted painterly, no faces, no text). Free tier: 1 generation per session per 24h. Plus tier: unlimited.
3. **City-blurred location.** Cloudflare's `cf-ipcity` header gives a city string, never an IP. Displayed as *"someone in St. Louis"* (or *"somewhere in the world"* when opted out). Default-on toggle, easy to opt out before submit.
4. **Curated daily drop at `/daily`.** Five hand-picked secrets at 20:00 UTC. Selection: top by `me_too_count` from the past 24h, max 1 per mood category for diversity. Cron lives in `.github/workflows/secret-box-daily-drop.yml`.
5. **Time-released posting.** Default 24-hour delay to prevent impulsive regret. Options: post now / 24h / 7d. The session cookie lets the user recall and cancel pending secrets before they release. Cron in `.github/workflows/secret-box-publish-queue.yml`.

## Abuse protection

- **Cloudflare Turnstile** on `POST /api/secrets`, `/api/comments`, `/api/upload`. Graceful degradation: when `TURNSTILE_SECRET_KEY` is unset, requests pass through and the rate-limiter alone protects the surface.
- **Tier-aware rate limits** keyed by session cookie:
  | Bucket | Free | Plus | Pro |
  |---|---|---|---|
  | secrets / 24h | 3 | 10 | unlimited |
  | comments / 60min | 5 | 5 | 5 |
  | AI imagery / 24h | 1 | unlimited | unlimited |
- **Cost-cap circuit breaker.** When daily Anthropic spend ≥ $5, AI features fail closed to a fixed-string compassionate fallback. Spend is tracked per day in `cost_ledger`.

## Stack

| Concern | Choice |
|---|---|
| Runtime | Next.js 16 (app router) |
| Database | Neon (serverless PostgreSQL) |
| Image hosting | Cloudinary (user uploads) + Replicate (AI imagery) |
| AI | Anthropic Claude Haiku 4.5 (compassion replies, comment moderation, image moderation) |
| AI imagery | Replicate FLUX schnell |
| Captcha | Cloudflare Turnstile |
| Cron | GitHub Actions workflows |
| Hosting | Vercel (project: `secret-box`) |
| Auth | None — fully anonymous, session cookie only |

## Local development

```sh
npm install
cp .env.example .env.local   # fill in DATABASE_URL etc.
psql "$DATABASE_URL" -f migrations/001_virality.sql
npm run dev
```

## Environment variables

Required:
- `DATABASE_URL` — Neon Postgres
- `ANTHROPIC_API_KEY` — Anthropic API (Haiku 4.5 used everywhere)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — user-image hosting
- `CRON_SECRET` — shared secret between Vercel and GitHub Actions cron
- `ENGINE_URL` — public origin (e.g. `https://secretbox.hive.baby`)

Optional (graceful-degrade when absent):
- `REPLICATE_API_TOKEN` — gates feature 2 (AI imagery)
- `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — gates Turnstile verification
- `PLUS_AUTH_SECRET` — HMAC for the eventual signed `hive_tier` cookie

## Cron jobs

- `secret-box-daily-drop.yml` — `0 20 * * *` (20:00 UTC) — POSTs `/api/daily/curate` with `Authorization: Bearer ${CRON_SECRET}`.
- `secret-box-publish-queue.yml` — `*/5 * * * *` (every 5 min) — POSTs `/api/publish-queue` to release time-released secrets.
- `secret-box-health.yml` — `0 */6 * * *` (every 6 h) — GETs `/api/health`.

## Hive integration

This engine is part of the [Hive](https://hive.baby) ecosystem and follows the canonical Hive standards (gold `#D4AF37`, ink `#0a0a0a`, 7-locale free tier `en/es/fr/ar/hi/zh/pt`, manifest + service worker + favicon set, ENGINE_GRAMMAR.md frontmatter, `/api/health` endpoint, "Made with ♥ in the Hive" footer signature).

## License

Free, forever. No ads. No investors. No agenda.
