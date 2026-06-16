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

Automation   N8N Cloud

Hosting      Vercel

CI/CD        GitHub → Vercel auto-deploy on push to main
```

---

## Architecture

```
User (browser) → Vercel (Next.js + /api/rag + /api/vision + /api/matching)

                      ↕ queries / responses

                 Supabase (DB + Auth + Storage + Edge Functions)

                      ↓ webhooks

                 N8N (automations → Groq + email alerts)

                      ↓

                 Groq API (LLM) + AWS Rekognition (vision)
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
- N8N Cloud account

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
├── app/                    # Next.js 14 app router
│   ├── (public)/           # Public-facing pages
│   │   ├── find-a-pet/     # F2 — Smart Adoption gallery
│   │   ├── lost-found/     # F3 — Lost & Found map
│   │   └── shelter/[id]/   # Public shelter profile + RAG chat
│   └── (shelter)/          # Shelter dashboard (private)
│       └── dashboard/      # F1 — Shelter Hub
├── api/
│   ├── rag/                # RAG query Vercel Function
│   ├── vision/             # Rekognition Vercel Function
│   └── matching/           # Compatibility matching Vercel Function
├── components/             # Shared UI components
├── lib/                    # Supabase client, helpers
├── docs/
│   ├── schema.sql          # Supabase schema (source of truth)
│   └── api-contracts/      # API endpoint contracts per feature
└── scripts/
    └── seed.py             # Fake data generator (CDMX coordinates)
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
| Eliana Mejia | Lead Engineer | Schema, API contracts, infra, scope control |
| Jose Montero | Frontend Engineer | UI generation, Leaflet map, animations, API integration |
| Gabriel Paez | Backend Engineer | RAG pipeline, vision matching, PostGIS, N8N, seed data |

---

## Docs

- `docs/schema.sql` — Supabase schema, maintained by Lead
- `docs/api-contracts/` — API contracts per feature, frozen before development
- `CLAUDE.md` — Context for AI coding tools
