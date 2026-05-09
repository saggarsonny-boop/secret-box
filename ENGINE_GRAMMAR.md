---
engine: HiveSecretBox
id: hivesecretbox
domain: hivesecretbox.hive.baby
domain_aliases:
  - secretbox.hive.baby
  - secret-box.hive.baby
repo: saggarsonny-boop/secret-box
owner: saggarsonny-boop

version: 2.1.0
status: live
tier: 1
schema: anonymous-confession
stack: [nextjs, typescript, neon, cloudinary, anthropic, replicate, cloudflare-turnstile]
premium: true
cost_profile: low_marginal
engine_class: nextjs

governance: QueenBee.MasterGrappler@pending
safety: enabled
multilingual: enabled
tone: gentle, anonymous, non-judgmental

api_models:
  - { role: compassionate_reply, model_id: claude-haiku-4-5-20251001 }
  - { role: comment_moderation, model_id: claude-haiku-4-5-20251001 }
  - { role: image_moderation, model_id: claude-haiku-4-5-20251001 }
  - { role: ai_imagery, model_id: black-forest-labs/flux-schnell, vendor: replicate }

env_vars_required:
  - DATABASE_URL
  - ANTHROPIC_API_KEY
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
  - CRON_SECRET
  - ENGINE_URL
env_vars_optional:
  - REPLICATE_API_TOKEN
  - TURNSTILE_SITE_KEY
  - TURNSTILE_SECRET_KEY
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY
  - PLUS_AUTH_SECRET

health_check: /api/health

onboarding_stack:
  auto_demo: implemented
  first_visit_card: implemented
  tooltip_tour: implemented
  install_hint: implemented
  first_visit_explainer: implemented
  rotating_placeholders: implemented

vercel_project: secret-box
deployment_protection: off

visibility: public
commercial_surface: freemium

# viral_loop_targets values constrained to the canonical V24 enum
# {referral, share_card, embed, pr_pickup, community_post}. The
# engine-specific viral mechanics (recognition button, AI imagery,
# city-blurred location, curated daily drop, time-released posting)
# all surface as either share-card content or community-post rituals;
# referral / embed / pr_pickup loops are not used.
viral_loop_targets:
  - share_card
  - community_post

production_state: listed
last_audit_at: 2026-05-09

# launch_checklist_state — canonical 8 booleans per V19. Cross-references:
#   - test_slot               docs/engine-archives/secret-box/test-station-slot.md (in hivebaby PR)
#   - seo_layout              app/layout.tsx (Metadata + Viewport + OG + manifest + appleWebApp)
#   - tooltip_tour            components/TooltipTour.tsx
#   - planet_or_udnav         hivebaby engines.json entry (in hivebaby PR)
#   - env_vars_confirmed      Vercel project secret-box (DB + Anthropic + Cloudinary set; Replicate/Turnstile optional)
#   - health_check            app/api/health/route.ts
#   - health_workflow_listed  .github/workflows/secret-box-health.yml
#   - engine_count_updated    hivebaby/CLAUDE.md §D row updated to PASS (in hivebaby PR)
launch_checklist_state:
  test_slot: true
  seo_layout: true
  tooltip_tour: true
  planet_or_udnav: true
  env_vars_confirmed: true
  health_check: true
  health_workflow_listed: true
  engine_count_updated: true

rate_limits:
  secrets:
    free: { count: 3, window_hours: 24 }
    plus: { count: 10, window_hours: 24 }
    pro: { count: unlimited }
  comments:
    all: { count: 5, window_minutes: 60 }
  ai_image:
    free: { count: 1, window_hours: 24 }
    plus: { count: unlimited }
    pro: { count: unlimited }

cost_cap:
  vendor: anthropic
  daily_cents: 500
  policy: fail_closed
---

## Purpose
HiveSecretBox is the anonymous-confession engine of the Hive ecosystem. People share what they cannot say out loud and read what others share, with no account, no IP storage, and no tracking. The viral mechanics — recognition, AI-generated imagery, gentle geographic intimacy, a curated daily drop, and a cooling-off period before posts go live — exist to amplify the cathartic core, not to acquire users at the cost of the engine's promise.

## Inputs
- Anonymous text secret (5–500 chars, mood category required, optional image)
- "Me too" recognition tap (anonymous, idempotent client-side)
- Comment on a secret (2–80 chars, AI-moderated for kindness)
- Image upload (5MB max, AI-moderated for faces / nudity / violence / personal info)
- Optional city share toggle (default: ON, blurred to city level only)
- Optional schedule (now / 24h / 7d)

## Outputs
- Real-time anonymous feed of published secrets
- "Most felt this week" highlight, "Secret of the day" highlight
- Curated daily drop at `/daily` (5 secrets, max 1 per mood, top by me_too_count)
- Compassionate AI reply (Anthropic Haiku 4.5, fallback message on cost-cap or failure)
- AI-generated illustration per secret (Replicate FLUX schnell, free tier rate-limited)
- City-blurred location: "someone in {city}" or "somewhere in the world"
- Pending-secrets recall list scoped to the current device session

## Rules
- **Anonymity is non-negotiable.** No accounts, no IP storage, no tracking analytics. Rate limits live in a session cookie that holds nothing personal.
- **Cooling-off matters.** Time-released posting is the default at 24h to prevent impulsive regret; the user can opt to post now.
- **Recognition over reaction.** "Me too" is the canonical interaction. Resonance count remains for backwards compatibility but the UX leads with recognition.
- **Diversity in the daily drop.** No single mood dominates the curated 5; the cron caps at 1 per category before topping up.
- **Gentle geography.** City strings only, never IP. Default ON but easy to opt out before submit.

## Safety Templates
- AI compassion replies: 2–3 sentences max, no advice, same language as the secret.
- Comment moderation: KIND or UNKIND classification; UNKIND comments are blocked with a "try something kinder" message.
- Image moderation: rejects FACES, NUDITY, VIOLENCE, PERSONAL.
- Cost cap: when daily Anthropic spend ≥ $5, AI features fail closed to a fixed-string fallback rather than running uncapped.

## Premium Locks
- **Plus** ($0.97/mo): AI imagery for every submission (free tier: 1 per session per 24h), 10 secrets / 24h, history of past daily drops.
- **Pro** ($29/mo): unlimited secrets, all Plus features.
- **Safety-critical** content (compassion replies, moderation, "me too", curated daily drop) is **never Pro-gated**.

## Phase Plan
- Phase 1 (this PR): viral features + canonical migration land together.
- Phase 2: rotating placeholders, push-notification opt-in for daily drop, share-image rendering for AI imagery.
- Phase 3: per-mood "ritual" sub-feeds, weekly digest email (opt-in only, never default).

## Deployment Notes
- Vercel project: `secret-box`. Auto-deploy on push to `main`.
- Cron jobs run from GitHub Actions workflows in `.github/workflows/`:
  - `secret-box-daily-drop.yml` — 20:00 UTC, curates the day's 5 secrets.
  - `secret-box-publish-queue.yml` — every 5 min, releases time-released secrets.
  - `secret-box-health.yml` — every 6h, pings `/api/health`.
  - All require GitHub Actions secrets `CRON_SECRET` and `ENGINE_URL`.

