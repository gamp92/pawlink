# Pawlink — System Architecture

Visual reference for the system design. Diagrams are written in [Mermaid](https://mermaid.js.org/) and render automatically on GitHub.

Source of truth reminders: database structure lives in [`schema.sql`](./schema.sql), API shapes live in [`api-contracts/`](./api-contracts/). If a diagram ever disagrees with those, the diagrams are the ones that are wrong.

---

## 1. High-level architecture

Everything is serverless: Next.js + `/api/*` functions on Vercel, data and async workflows on Supabase, third-party AI/email services called from functions only (never from the browser).

```mermaid
flowchart TB
    subgraph Users
        shelter["Shelter user<br/>(authenticated)"]
        public["Public user<br/>(anonymous)"]
    end

    subgraph Vercel["Vercel"]
        subgraph next["Next.js 14 (app router)"]
            hub["/dashboard/*<br/>F1 Shelter Hub (private)"]
            findapet["/find-a-pet + /shelter/[id]<br/>F2 Smart Adoption (public)"]
            lostfound["/lost-found<br/>F3 Lost & Found (public)"]
            assistant["ShelterAssistant widget<br/>F4 RAG (public, in /shelter/[id])"]
        end
        subgraph api["/api/* — Vercel Functions (10s limit)"]
            apiCrud["animals · shelters ·<br/>adoption-requests · lost-found ·<br/>alert-subscriptions"]
            apiMatching["matching"]
            apiVision["vision"]
            apiRag["rag/query · rag/documents<br/>(proxy)"]
        end
    end

    subgraph Supabase["Supabase (us-east-1)"]
        auth["Auth<br/>(shelter role)"]
        db[("PostgreSQL<br/>PostGIS + pgvector<br/>RLS per shelter_id")]
        storage["Storage<br/>pets (public)<br/>documents (private)"]
        webhooks["Database Webhooks"]
        subgraph edge["Edge Functions (Deno, 150s limit)"]
            efSocial["social-post"]
            efGeo["geo-alert"]
            efAdopt["adoption-confirmation"]
        end
    end

    subgraph External["External services"]
        groq["Groq API<br/>Llama 3 8B"]
        rekognition["AWS Rekognition"]
        resend["Resend<br/>email API"]
        ragService["pawlink-rag service<br/>(separate repo, Python)"]
    end

    shelter --> hub
    public --> findapet
    public --> lostfound
    public --> assistant

    hub --> api
    findapet --> api
    lostfound --> api
    assistant --> apiRag

    hub -->|login| auth
    api --> db
    api --> storage
    apiMatching --> groq
    apiVision --> rekognition
    apiRag -->|X-Internal-Key| ragService

    db --> webhooks
    webhooks --> edge
    efSocial --> groq
    efGeo --> resend
    efAdopt --> resend
    efSocial -->|writes social_post| db
```

Key boundaries:

- **F1 `/dashboard/*` is private** — only authenticated shelter users, never linked publicly.
- **Multi-tenant** — every shelter-owned table has `shelter_id`; RLS enforces it at the DB level and every query filters by it anyway (defense in depth).
- **No always-on servers** — long work (>10s) goes to Supabase Edge Functions triggered by Database Webhooks, not to Vercel Functions.
- **No account needed for the public** — adoption requests carry inline contact info (`full_name`, `email`, `phone`) and geo-alerts are an email opt-in (`alert_subscriptions`), so anonymous users never touch Supabase Auth.

---

## 2. Feature → endpoint → table map

Who calls what, and whether it reads or writes. Solid arrows = the feature calls the endpoint; labeled arrows = what the endpoint does to each table. Verified against the route handlers in `app/api/`.

### F1 — Shelter Hub (`/dashboard`, private)

```mermaid
flowchart LR
    F1["/dashboard<br/>Shelter Hub"]

    animalsList["GET /api/animals"]
    animalsCreate["POST /api/animals"]
    animalsEdit["PATCH · DELETE<br/>/api/animals/[id]"]
    reqList["GET /api/adoption-requests<br/>?shelter_id"]
    reqUpdate["PATCH<br/>/api/adoption-requests/[id]"]

    tAnimals[("animals")]
    tRequests[("adoption_requests")]

    F1 --> animalsList -->|reads| tAnimals
    F1 --> animalsCreate -->|writes ⚡ social-post| tAnimals
    F1 --> animalsEdit -->|writes| tAnimals
    F1 --> reqList -->|"reads (joins animals)"| tRequests
    F1 --> reqUpdate -->|"writes status/notes ⚡ adoption-confirmation"| tRequests
```

### F2 — Smart Adoption (`/find-a-pet` + `/shelter/[id]`, public)

```mermaid
flowchart LR
    F2["/find-a-pet<br/>+ /shelter/[id]"]

    animalsPublic["GET /api/animals/public"]
    shelterGet["GET /api/shelters/[id]"]
    matching["POST /api/matching"]
    reqCreate["POST /api/adoption-requests"]

    tAnimals[("animals")]
    tShelters[("shelters")]
    tRequests[("adoption_requests")]
    groq["Groq Llama 3"]

    F2 --> animalsPublic -->|"reads (available only)"| tAnimals
    F2 --> shelterGet -->|reads| tShelters
    shelterGet -->|reads| tAnimals
    F2 --> matching -->|reads| tAnimals
    matching -->|compatibility score| groq
    F2 --> reqCreate -->|"writes (inline contact,<br/>409 on duplicate pending)"| tRequests
```

### F3 — Lost & Found (`/lost-found`, public)

```mermaid
flowchart LR
    F3["/lost-found"]

    lfList["GET /api/lost-found"]
    lfCreate["POST /api/lost-found"]
    lfUpdate["PATCH /api/lost-found/[id]"]
    vision["POST /api/vision"]
    subCreate["POST /api/alert-subscriptions"]
    subDelete["GET /api/alert-subscriptions<br/>/unsubscribe?token"]

    tReports[("lost_found_reports")]
    tSubs[("alert_subscriptions")]
    rekognition["AWS Rekognition"]

    F3 --> lfList -->|"reads (RPC get_reports_near_point<br/>when lat/lng given)"| tReports
    F3 --> lfCreate -->|writes ⚡ geo-alert| tReports
    F3 --> lfUpdate -->|writes status| tReports
    F3 --> vision -->|"reads photos, writes<br/>matched_report_id + confidence"| tReports
    vision -->|DetectLabels| rekognition
    F3 --> subCreate -->|upserts by email| tSubs
    F3 --> subDelete -->|deletes by token| tSubs
```

### F4 — RAG Shelter Assistant (chat widget in `/shelter/[id]`, public)

```mermaid
flowchart LR
    F4["ShelterAssistant<br/>widget"]

    ragQuery["POST /api/rag/query"]
    ragDocs["GET /api/rag/documents<br/>?shelter_id"]

    ragService["pawlink-rag service<br/>(separate repo)"]

    F4 --> ragQuery -->|"proxy, streams SSE back"| ragService
    F4 --> ragDocs -->|"proxy, lists indexed docs"| ragService
```

The RAG endpoints are **pure proxies** — they touch no Supabase table in this repo. They exist so the `RAG_INTERNAL_API_KEY` stays server-side; the actual retrieval/generation pipeline lives in the separate `pawlink-rag` service (`RAG_SERVICE_URL`). The F4 tables in `schema.sql` remain commented out — document storage is the service's concern.

⚡ = the write fires a Database Webhook that triggers the Edge Function named next to it (see section 4).

Full reference table:

| Feature | Endpoint | Reads | Writes | External |
|---|---|---|---|---|
| F1 | `GET /api/animals` | `animals` | — | — |
| F1 | `POST /api/animals` | — | `animals` ⚡ social-post | — |
| F1 | `PATCH · DELETE /api/animals/[id]` | — | `animals` | — |
| F1 | `GET /api/adoption-requests?shelter_id` | `adoption_requests` + `animals` | — | — |
| F1 | `PATCH /api/adoption-requests/[id]` | — | `adoption_requests` ⚡ adoption-confirmation (on `approved`) | — |
| F2 | `GET /api/animals/public` | `animals` (available only) | — | — |
| F2 | `GET /api/shelters/[id]` | `shelters`, `animals` | — | — |
| F2 | `POST /api/matching` | `animals` | — | Groq |
| F2 | `POST /api/adoption-requests` | — | `adoption_requests` (inline contact, 409 dedupe) | — |
| F3 | `GET /api/lost-found` | `lost_found_reports` (RPC `get_reports_near_point`) | — | — |
| F3 | `POST /api/lost-found` | — | `lost_found_reports` ⚡ geo-alert | — |
| F3 | `PATCH /api/lost-found/[id]` | — | `lost_found_reports` (status) | — |
| F3 | `POST /api/vision` | `lost_found_reports` (photos) | `lost_found_reports` (match fields, both rows) | AWS Rekognition |
| F3 | `POST /api/alert-subscriptions` | — | `alert_subscriptions` (upsert by email) | — |
| F3 | `GET /api/alert-subscriptions/unsubscribe` | — | `alert_subscriptions` (delete by token) | — |
| F4 | `POST /api/rag/query` | — | — | pawlink-rag (SSE) |
| F4 | `GET /api/rag/documents` | — | — | pawlink-rag |
| debug | `POST /api/lost-found/alert` | `alert_subscriptions` (RPC `get_users_near_report`) | — | — |

`POST /api/lost-found/alert` is a debug-only endpoint kept for manually verifying the PostGIS radius query — it does not send emails (the geo-alert Edge Function owns that).

---

## 3. Data model

Simplified view of `schema.sql` (see the file for full columns, constraints, and RLS policies).

Notes on the current state:

- `adoption_requests` now carries the adopter's contact inline (`full_name`, `email`, `phone`) — no account needed. A partial unique index (`animal_id` + `email` where `status = 'pending'`) backs the 409 dedupe.
- `alert_subscriptions` is a standalone opt-in table (email + map point) with no FKs; only the service role touches it. It replaced `family_profiles` as the source of geo-alert recipients.
- `family_profiles` is **legacy** — already backfilled into `alert_subscriptions` and scheduled for removal in phase 2.
- `lost_found_reports.matched_report_id` is a self-reference to the same table (set by the vision match, linking a *lost* report to its *found* counterpart) — drawn as a column note instead of a relationship line for readability.

```mermaid
erDiagram
    shelters ||--o{ shelter_users : "has staff"
    shelters ||--o{ animals : "manages"
    shelters ||--o{ adoption_requests : "receives"
    animals ||--o{ adoption_requests : "requested in"

    shelters {
        uuid id PK
        text name
        geography location "POINT 4326"
    }
    shelter_users {
        uuid shelter_id FK
        uuid user_id FK "auth.users"
    }
    animals {
        uuid id PK
        uuid shelter_id FK
        text social_post "set by social-post EF"
    }
    adoption_requests {
        uuid id PK
        uuid animal_id FK
        uuid shelter_id FK
        text full_name "inline contact, no account"
        text email "dedupe: unique pending per animal"
        text phone
        text status "approved triggers email"
    }
    alert_subscriptions {
        uuid id PK
        text email UK
        geography location "POINT 4326, geo-alert 2km query"
        uuid unsubscribe_token UK
    }
    lost_found_reports {
        uuid id PK
        uuid reporter_id FK "auth.users, nullable"
        uuid matched_report_id FK "self-ref, set by vision match"
        geography location "POINT 4326"
    }
```

---

## 4. Async workflows (Database Webhooks → Edge Functions)

Three workflows fire on database events. Edge Function code lives in `supabase/functions/<name>/index.ts` and must be deployed manually (`supabase functions deploy <name>`) — it does not auto-deploy on push.

```mermaid
sequenceDiagram
    participant DB as Supabase Postgres
    participant WH as Database Webhook
    participant EF as Edge Function
    participant Groq as Groq (Llama 3)
    participant Resend as Resend

    rect rgba(128, 128, 128, 0.12)
        Note over DB,Resend: social-post — INSERT into animals
        DB->>WH: INSERT animals
        WH->>EF: invoke social-post
        EF->>Groq: generate Spanish IG/FB post
        Groq-->>EF: post text
        EF->>DB: save to animals.social_post
    end

    rect rgba(128, 128, 128, 0.05)
        Note over DB,Resend: geo-alert — INSERT into lost_found_reports
        DB->>WH: INSERT lost_found_reports
        WH->>EF: invoke geo-alert
        EF->>DB: RPC get_users_near_report<br/>(alert_subscriptions within 2km)
        DB-->>EF: subscribers + unsubscribe tokens
        EF->>Resend: alert email per subscriber<br/>(includes unsubscribe link)
    end

    rect rgba(128, 128, 128, 0.12)
        Note over DB,Resend: adoption-confirmation — UPDATE adoption_requests → approved
        DB->>WH: UPDATE status = approved
        WH->>EF: invoke adoption-confirmation
        EF->>DB: read contact from request row<br/>+ animal and shelter names
        DB-->>EF: email, names
        EF->>Resend: confirmation email to adopter
    end
```
