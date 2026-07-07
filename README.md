# Pawlink 🐾

AI-native platform connecting shelters, families and communities for responsible pet adoption, recovery and care across LATAM.

Built as part of TheStartupExperience 2.0 — Demo Day July 22/29, 2025.

---

## What it does

Pawlink is a B2B SaaS tool for animal shelters. Shelters use it to manage their operations; families and the public benefit from it as end users at no cost.

| Feature | Who uses it | What it does |
|---|---|---|
| F1 — Shelter Hub | Shelter (private) | Animal inventory, adoption requests, AI-generated social posts |
| F2 — Smart Adoption | Public | 5-question questionnaire → AI compatibility matching → adopt |
| F3 — Lost & Found | Public | Report lost/found pets, geo-alerts to neighbors, vision matching |
| F4 — RAG Assistant | Public | Ask questions answered from that shelter's own documents |

---

## Stack

```
Frontend     Next.js 14 · Tailwind CSS · shadcn/ui · Leaflet · Framer Motion

Backend      Supabase (PostgreSQL + PostGIS + pgvector + Auth + Storage)
             Vercel Functions (RAG queries + vision matching)

AI           Groq API · Llama 3 8B · LangChain LCEL · sentence-transformers

Vision       AWS Rekognition

Automation   Supabase Database Webhooks → Edge Functions (Deno) → Resend

Hosting      Vercel

CI/CD        GitHub → Vercel auto-deploy on push to main
```

---

## Architecture

```
User (browser) → Vercel (Next.js + /api/rag + /api/vision + /api/matching)

                      ↕ queries / responses

                 Supabase (DB + Auth + Storage + Edge Functions)

                      ↓ Database Webhooks

                 Supabase Edge Functions (social-post · geo-alert · adoption-confirmation)

                      ↓

                 Groq API (LLM) + Resend (email) + AWS Rekognition (vision)
```

Key design decisions:

- **Serverless-first** — no dedicated servers, no Docker, no always-on processes
- **Multi-tenant by design** — every table has `shelter_id`, RLS enforced at DB level
- **RAG ingestion** runs in Supabase Edge Functions (150s limit) — separate from query path (Vercel Functions, 10s limit)

---

## Local setup

### Prerequisites

- Node.js 18+
- A Supabase project with PostGIS and pgvector enabled
- Groq API key (free at console.groq.com)
- AWS account with Rekognition access
- Resend account (free tier: 3,000 emails/month)

### Steps

```bash
# 1. Clone
git clone https://github.com/your-org/pawlink
cd pawlink

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your keys (see .env.example for required vars)

# 4. Apply Supabase schema
# Run docs/schema.sql in your Supabase SQL editor

# 5. Seed fake data (optional but recommended for dev)
python3 scripts/seed.py

# 6. Run
npm run dev
```

App runs at http://localhost:3000

---

## API documentation (Swagger)

Interactive OpenAPI docs for all `/api/*` endpoints:

```
https://pawlink-theta.vercel.app/api-docs      ← Swagger UI (try endpoints live)
https://pawlink-theta.vercel.app/openapi.yaml  ← raw spec (importable into Postman)
```

Locally: `npm run dev` → http://localhost:3000/api-docs

The spec lives at `public/openapi.yaml` and is written by hand from the route
handlers and `docs/api-contracts/`. When an endpoint changes, update the spec
in the same PR. Validate with:

```bash
npx @apidevtools/swagger-cli validate public/openapi.yaml
```

---

## Smoke test

`scripts/smoke-test.mjs` exercises every endpoint against real infrastructure
(Vercel + Supabase + webhooks + Edge Functions + Groq) — no mocks. Run it
before Demo Day, after big merges, or whenever Supabase wakes from a pause.

```bash
node scripts/smoke-test.mjs                        # against production
node scripts/smoke-test.mjs http://localhost:3000  # against local dev
node scripts/smoke-test.mjs --matching             # include /api/matching (burns Groq tokens)
```

It discovers seeded rows through the public API, creates throwaway rows to
test writes and async webhooks (social-post, geo-alert), and deletes
everything it created. Needs `.env` (service role) for the adoption-request
checks and cleanup; without it those are skipped. Exits non-zero on failure.

---

## Environment variables

See `.env.example` for the full list. Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

---

## Project structure

```
pawlink/
│
├── README.md
├── CLAUDE.md
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
│
├── app/                          # Next.js 14 app router
│   ├── layout.tsx                # Root layout — fonts, global providers
│   ├── page.tsx                  # Public landing page
│   │
│   ├── (public)/                 # Public routes — no login required
│   │   ├── find-a-pet/
│   │   │   └── page.tsx          # F2 — Animal gallery
│   │   ├── shelter/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Public shelter profile + RAG chat
│   │   └── lost-found/
│   │       └── page.tsx          # F3 — Map + reports
│   │
│   └── (shelter)/                # Private routes — shelter only
│       ├── layout.tsx            # Sidebar + auth guard
│       └── dashboard/
│           ├── page.tsx          # F1 — Main dashboard
│           ├── animals/
│           │   └── page.tsx      # Animal inventory
│           ├── requests/
│           │   └── page.tsx      # Adoption requests
│           └── documents/
│               └── page.tsx      # Doc upload for RAG
│
├── api/                          # Vercel Functions (serverless backend)
│   ├── rag/
│   │   └── route.ts              # RAG query — retrieval + Groq + streaming
│   ├── vision/
│   │   └── route.ts              # Rekognition — photo comparison
│   └── matching/
│       └── route.ts              # Groq matching — family-animal compatibility
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui — auto-generated
│   ├── shelter/                  # Private dashboard components
│   ├── public/                   # Public page components
│   └── shared/                   # Used on both sides
│       ├── AnimalCard.tsx
│       ├── ShelterProfile.tsx
│       └── RagChat.tsx
│
├── lib/                          # Shared logic and clients
│   ├── supabase/
│   │   ├── client.ts             # Browser client (ANON KEY)
│   │   └── server.ts             # Server client (SERVICE ROLE KEY)
│   ├── groq.ts                   # Groq API client
│   ├── rekognition.ts            # AWS Rekognition client
│   └── utils.ts                  # General helpers
│
├── rag/                          # Full RAG pipeline
│   ├── ingest.py                 # PDF ingestion — runs in Edge Function
│   ├── embeddings.py             # Local sentence-transformers
│   └── chain.py                  # LangChain LCEL chain
│
├── scripts/
│   └── seed.py                   # Fake data — 5 shelters, 50 animals, CDMX coords
│
└── docs/
    ├── schema.sql                # Supabase schema — source of truth
    └── api-contracts/
        ├── f1-shelter-hub.md
        ├── f2-smart-adoption.md
        ├── f3-lost-found.md
        └── f4-rag-assistant.md
```

---

## Branch strategy

```
main    → production, connected to Vercel, PRs only
dev     → integration branch, merge features here first
feat/*  → individual feature branches, PR into dev
```

Rule: No direct pushes to `main`. All changes via PR.

---

## Team

| Name | Role | Responsibilities |
|---|---|---|
| Jose Montero | Frontend Engineer | UI generation, Leaflet map, animations, API integration |
| Gabriel Paez | Backend Engineer | RAG pipeline, vision matching, PostGIS, Edge Functions, seed data |

---

## Docs

- `docs/schema.sql` — Supabase schema, maintained by Lead
- `docs/api-contracts/` — API contracts per feature, frozen before development
- `public/openapi.yaml` — OpenAPI spec, served interactively at `/api-docs`
- `CLAUDE.md` — Context for AI coding tools
