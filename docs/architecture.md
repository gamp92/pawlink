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
        end
        subgraph api["/api/* — Vercel Functions (10s limit)"]
            apiCrud["animals · shelters ·<br/>adoption-requests · lost-found"]
            apiMatching["matching"]
            apiVision["vision"]
            apiRag["rag (F4, stretch)"]
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
    end

    shelter --> hub
    public --> findapet
    public --> lostfound

    hub --> api
    findapet --> api
    lostfound --> api

    hub -->|login| auth
    api --> db
    api --> storage
    apiMatching --> groq
    apiRag --> groq
    apiVision --> rekognition

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

---

## 2. Data model

Simplified view of `schema.sql` (see the file for full columns, constraints, and RLS policies). F4 tables (`shelter_documents`, `document_chunks`) are commented out in the schema until the stretch feature is built.

```mermaid
erDiagram
    shelters ||--o{ shelter_users : "has staff"
    shelters ||--o{ animals : "manages"
    shelters ||--o{ adoption_requests : "receives"
    animals ||--o{ adoption_requests : "requested in"
    family_profiles ||--o{ adoption_requests : "submits"
    lost_found_reports }o--o| lost_found_reports : "matched_report_id"

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
    family_profiles {
        uuid id PK
        uuid user_id FK "auth.users"
    }
    adoption_requests {
        uuid id PK
        uuid animal_id FK
        uuid shelter_id FK
        uuid family_id FK
        text status "approved triggers email"
    }
    lost_found_reports {
        uuid id PK
        uuid reporter_id FK "auth.users, nullable"
        uuid matched_report_id FK
        geography location "POINT 4326"
    }
```

---

## 3. Async workflows (Database Webhooks → Edge Functions)

Three workflows fire on database events. Edge Function code lives in `supabase/functions/<name>/index.ts` and must be deployed manually (`supabase functions deploy <name>`) — it does not auto-deploy on push.

```mermaid
sequenceDiagram
    participant DB as Supabase Postgres
    participant WH as Database Webhook
    participant EF as Edge Function
    participant Groq as Groq (Llama 3)
    participant Resend as Resend

    rect rgb(235, 244, 255)
        Note over DB,Resend: social-post — INSERT into animals
        DB->>WH: INSERT animals
        WH->>EF: invoke social-post
        EF->>Groq: generate Spanish IG/FB post
        Groq-->>EF: post text
        EF->>DB: save to animals.social_post
    end

    rect rgb(235, 255, 240)
        Note over DB,Resend: geo-alert — INSERT into lost_found_reports
        DB->>WH: INSERT lost_found_reports
        WH->>EF: invoke geo-alert
        EF->>DB: PostGIS ST_DWithin (2km radius)
        DB-->>EF: nearby users
        EF->>Resend: email alerts to each user
    end

    rect rgb(255, 245, 235)
        Note over DB,Resend: adoption-confirmation — UPDATE adoption_requests → approved
        DB->>WH: UPDATE status = approved
        WH->>EF: invoke adoption-confirmation
        EF->>Resend: confirmation email to family
    end
```

---

## 4. RAG pipeline (F4 — stretch)

Only built if F1–F3 are done ahead of schedule. Contracts in [`api-contracts/f4-rag-assistant.md`](./api-contracts/f4-rag-assistant.md). The assistant answers **only** from the shelter's own documents — if the answer is not in the retrieved chunks, it must say so.

### Ingestion — once per document (Supabase Edge Function, 150s limit)

```mermaid
flowchart LR
    pdf["PDF uploaded<br/>by shelter"] --> extract["PyMuPDF<br/>text extraction"]
    extract --> chunk["Semantic chunking<br/>~500 tokens,<br/>50-token overlap"]
    chunk --> embed["sentence-transformers<br/>all-MiniLM-L6-v2<br/>(local, 384 dims)"]
    embed --> store[("pgvector<br/>VECTOR(384)<br/>tagged with shelter_id")]
```

### Query — every user question (Vercel Function `/api/rag`, 10s limit)

```mermaid
flowchart LR
    q["User question<br/>(chat widget on /shelter/[id])"] --> qembed["Embed with<br/>all-MiniLM-L6-v2"]
    qembed --> search[("pgvector similarity<br/>top 4 chunks,<br/>filtered by shelter_id")]
    search --> chain["LangChain LCEL:<br/>question + chunks"]
    chain --> llm["Groq Llama 3 8B"]
    llm --> stream["StreamingResponse<br/>+ source citation"]
```

Both sides use the **same embedding model** — query vectors and document vectors must live in the same 384-dim space.
