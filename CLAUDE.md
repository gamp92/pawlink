# CLAUDE.md — Pawlink

This file gives Claude Code the context it needs to work effectively on this codebase. Read this before making any changes.

---

## What this project is

Pawlink is a B2B SaaS platform for animal shelters in LATAM. Shelters pay for it; families and the public use it for free. Built in 7 weeks for TheStartupExperience 2.0, Demo Day July 22/29 2025.

Two user profiles:

- **Shelter** — logs in, accesses private dashboard (Shelter Hub), manages animals, sees adoption requests, uploads documents
- **Public** — no login required, browses Find a pet gallery, views shelter public profiles, reports lost/found pets, chats with RAG assistant

---

## Stack and where things live

```
Frontend     Next.js 14 (app router), Tailwind CSS, shadcn/ui, Leaflet, Framer Motion

Database     Supabase — PostgreSQL with PostGIS and pgvector extensions enabled

Auth         Supabase Auth — shelter users have a role, public users are anonymous

Storage      Supabase Storage — pet photos in `pets` bucket, shelter docs in `documents` bucket

AI           Groq API with Llama 3 8B — called from Vercel Functions and Supabase Edge Functions

RAG          LangChain LCEL + sentence-transformers (all-MiniLM-L6-v2) + pgvector

Vision       AWS Rekognition — called from /api/vision Vercel Function

Automation   Supabase Database Webhooks → Supabase Edge Functions (Deno) → Resend email API

Hosting      Vercel — frontend + all /api/* serverless functions
```

---

## Critical rules — read before writing any code

**1. Schema is the source of truth**
`docs/schema.sql` is the only source of truth for the database structure. Never infer table names, column names, or relationships from context — always check `schema.sql` first. If `schema.sql` doesn't exist yet, ask before assuming.

**2. Multi-tenant by design**
Every table that belongs to a shelter has a `shelter_id` column. Row Level Security (RLS) is enforced at the database level. Never query across shelter boundaries. When writing Supabase queries, always include the `shelter_id` filter even if you think it's redundant — RLS is a second layer of protection, not the only one.

**3. No dedicated servers**
Everything runs serverless. No Express servers, no FastAPI, no Docker. Backend logic lives in:

- `/api/*` — Vercel Functions (10s limit, for queries and real-time operations)
- Supabase Edge Functions (150s limit, for async workflows triggered by Database Webhooks)

If a task seems to need a long-running process, ask before creating one.

**4. API contracts come first**
`docs/api-contracts/` contains the agreed API shapes per feature. Frontend and backend must match these exactly. If a contract doesn't exist for something you're building, stop and flag it.

**5. Environment variables**
Never hardcode keys. Always use the env vars defined in `.env.example`. On Vercel, these are injected automatically.

**6. Edge Functions are NOT auto-deployed**
Code in `supabase/functions/` is versioned in this repo but does NOT sync automatically with Supabase. After editing any Edge Function you must deploy it manually:
```bash
supabase functions deploy <function-name>
```
Vercel auto-deploys on push to main. Supabase Edge Functions do not — they require an explicit deploy step.

---

## RAG pipeline — how it works

The RAG system is the most technically complex part of the codebase. Understand this before touching it.

**Ingestion** (runs once per document, in Supabase Edge Function):

```
PDF uploaded by shelter
→ PyMuPDF extracts text
→ Semantic chunking (~500 tokens, 50-token overlap)
→ sentence-transformers generates embeddings locally (all-MiniLM-L6-v2)
→ Vectors stored in pgvector with shelter_id tag
```

**Query** (runs on every user question, in Vercel Function `/api/rag`):

```
User question
→ Embedded with same sentence-transformers model
→ pgvector similarity search (top 4 chunks, filtered by shelter_id)
→ LangChain LCEL chain: question + chunks → Groq Llama 3
→ StreamingResponse back to frontend
→ Answer includes source document citation
```

Key constraint: the RAG assistant **ONLY** answers from the shelter's own documents. If the answer is not in the documents, it must say so — never hallucinate or use general knowledge.

---

## Supabase conventions

- **Client-side**: use `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (respects RLS)
- **Server-side / admin operations**: use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — use carefully)
- **PostGIS**: geo coordinates stored as `GEOGRAPHY(POINT, 4326)`, queries use `ST_DWithin`
- **pgvector**: embeddings stored as `VECTOR(384)` (all-MiniLM-L6-v2 output dimension)
- **Storage buckets**: `pets` (public), `documents` (private, shelter only)

---

## Edge Function workflows

Three async workflows, all triggered by Supabase Database Webhooks → Supabase Edge Functions (Deno) → Resend:

| Edge Function | Trigger | What it does |
|---|---|---|
| `social-post` | INSERT into `animals` | Calls Groq → generates Spanish Instagram/Facebook post → saves to `animals.social_post` |
| `geo-alert` | INSERT into `lost_found_reports` | PostGIS radius query → sends email alerts to users within 2km via Resend |
| `adoption-confirmation` | UPDATE `adoption_requests` where status → `approved` | Sends confirmation email to family via Resend |

Code lives in `supabase/functions/<name>/index.ts`. After editing, deploy manually:
```bash
supabase functions deploy <function-name>
```

---

## Feature ownership and boundaries

**F1 — Shelter Hub** (private, shelter only)

- Route: `/dashboard/*`
- The public NEVER sees this. Not even the URL.
- Shelter sees this after login with their account

**F2 — Smart Adoption** (public)

- Route: `/find-a-pet` (gallery) and `/shelter/[id]` (individual shelter profile)
- The shelter public profile is NOT the same as the Shelter Hub dashboard
- Matching logic lives in `/api/matching`

**F3 — Lost & Found** (public)

- Route: `/lost-found`
- Coordinates are set by clicking the map — not real GPS
- Vision matching in `/api/vision` — compares photos using Rekognition

**F4 — RAG Shelter Assistant** (public, embedded in shelter profile)

- Component lives in `/shelter/[id]` page
- Chat widget visible to anyone visiting a shelter's public profile
- Queries `/api/rag` with the `shelter_id` from the URL

---

## Fake data

`scripts/seed.py` generates realistic fake data for development:

- 5 shelters with real CDMX coordinates
- 50 animals with Unsplash photos
- 7 geo-test alert subscriptions (no accounts — email + map point)
- 10 lost/found reports

For geo-testing, alert subscriptions are seeded at known distances from a reference point:

| Email | Distance | Expected behavior |
|---|---|---|
| test+near@gmail.com | ~400m | should receive alerts |
| test+mid@gmail.com | ~1.2km | should receive alerts |
| test+far@gmail.com | ~4km | should NOT receive alerts |

All these aliases deliver to the same Gmail inbox.

---

## What NOT to do

- Don't create new API routes without checking `docs/api-contracts/` first
- Don't add Railway, Docker, Redis, Celery, or any always-on service
- Don't query Supabase without a `shelter_id` filter on multi-tenant tables
- Don't use `SUPABASE_SERVICE_ROLE_KEY` on the client side
- Don't build the Community module or MCP Server — these are explicitly out of scope for MVP
- Don't run `create-next-app` or restructure the project without checking with the team first
- Don't push directly to `main` — always PR through `dev`

---

## Current status

Week-by-week plan:

| Week | Focus |
|---|---|
| Week 1 | Foundation — schema, API contracts, infra, design system, fake data |
| Week 2 | F1 — Shelter Hub |
| Week 3 | F2 — Smart Adoption |
| Week 4 | F3 — Lost & Found (reports + map) |
| Week 5 | F3 — Lost & Found (vision matching) |
| Week 6 | Polish + demo preparation |
| Week 7 | Demo Day — July 22 or 29, 2025 |

F4 (RAG Shelter Assistant) is built if the team is ahead of schedule after F1–F3.

---

## Questions or blockers

If something is unclear — especially about the schema, API contracts, or RAG pipeline — stop and ask rather than making assumptions. The worst outcome is frontend and backend building against different data shapes and having to redo work at integration time.

## Key decisions made during planning

### Business model
Pawlink is B2B SaaS — shelters are the paying client, not the public.
The public uses the app for free and reaches it through the shelter's
own channels (Instagram, Facebook, direct contact). This resolves the
two-sided distribution problem. Reference: Pawlytics ($29-49/mo),
Shelterluv ($2/adoption).

### Architecture decisions
- No Railway, no Docker, no dedicated servers — everything serverless
- Vercel Functions for RAG queries and vision matching (10s limit is
  sufficient for demo scale)
- Supabase Edge Functions for document ingestion only (150s limit)
- GitHub Actions not needed — Vercel auto-deploys on push to main

### Deployment
- Every push to main auto-deploys to Vercel (configured once, automatic forever)
- Branch strategy: main (production) → dev (integration) → feat/* (features)
- No direct pushes to main — all changes via PR

### Region decision
- Supabase hosted in `us-east-1` (Virginia) — chosen as geographic midpoint between LATAM and Europe
- Avoids latency extremes: ~80-100ms from both regions vs. optimizing for one

### Scope decisions
- F1, F2, F3 are must-have for Demo Day
- F4 (RAG) is stretch — only if F1-F3 are done and time allows
- Community module and MCP Server are explicitly out of scope for MVP
- Volunteer module removed from F1
- No public accounts: adoption requests carry contact inline; geo-alerts use email subscriptions (family_profiles dropped — July 14, 2026)

### Fake data for testing
- Seed script generates: 5 shelters (CDMX), 50 animals, 7 geo-test alert subscriptions (no accounts — email + map point), 10 lost/found reports
- Geo-test users cover CDMX (near/mid/far from Parque México), Madrid, and Ecuador (Quito + Guayaquil)
- Coordinates and photos are always independent — no real GPS needed

### Current state
- Repo created: https://github.com/gamp92/pawlink
- Structure created: app/, components/, lib/, rag/, scripts/, docs/
- Schema ready: docs/schema.sql (not yet run in Supabase)
- API contracts ready: docs/api-contracts/f1-f4
- API stubs ready: app/api/* (frontend unblocked)
- Supabase project: created — `pawlink` (ref: etxjyvjrinsvrnzqwmpf, region: us-east-1)
- Vercel: connected — https://pawlink-theta.vercel.app
- Next step: F1 — Shelter Hub
