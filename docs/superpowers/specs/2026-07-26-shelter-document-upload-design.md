# Real Shelter Document Upload (Dashboard) — Design

**Date:** 2026-07-26
**Status:** Approved by Gabriel (scope, table shape, route split, and RAG decoupling confirmed in design session)
**Triggered by:** the dashboard's "Documents" section (`components/shelter/DocumentsManager.tsx`) is 100% mock — no API call, no file leaves the browser, nothing is stored. Discovered while auditing demo-day readiness.

## Problem

`docs/schema.sql` deliberately has no table for shelter documents today — the F4 design assumed document storage was the external **pawlink-rag** service's concern (`docs/architecture.md:186`: "document storage is the service's concern"). That assumption only covers the two pre-seeded test shelters whose documents were ingested directly into pawlink-rag, outside this repo. There is no path for a real shelter to upload anything, and the dashboard button that looks like it does is a fake `setInterval` progress bar.

## Scope decision: decoupled from RAG, not wired to pawlink-rag

This feature makes shelters able to really upload and manage their own PDFs, persisted in Pawlink's own Supabase project. It is **explicitly not** connected to the RAG assistant — uploading a document here does not make the chatbot smarter. The RAG assistant keeps working exactly as it does today, reading only from the two pre-seeded test shelters in the separate pawlink-rag service.

Reasoning: wiring this repo to pawlink-rag's ingestion would require confirming that service even exposes an ingestion API (unknown — we've only ever called its `GET /documents` and query/chat endpoints) and coordinating with the teammate who owns that repo. That's cross-team integration risk this close to demo day. Shipping a self-contained real upload now is lower-risk and still turns a fake button into a real feature. Connecting the two systems is a deliberate, separate follow-up once the other repo's capabilities are confirmed.

## Schema — `shelter_documents`

Adapts the table already sketched (commented out) at `docs/schema.sql:406-414`, dropping the parts that only make sense with real ingestion:

```sql
create table shelter_documents (
  id            uuid primary key default gen_random_uuid(),
  shelter_id    uuid references shelters(id) on delete cascade,
  file_name     text not null,
  storage_path  text not null,
  status        text default 'ready',
  created_at    timestamptz default now()
);

create index shelter_documents_shelter_id_idx on shelter_documents(shelter_id);

alter table shelter_documents enable row level security;

create policy "shelter_documents_shelter_all"
  on shelter_documents for all
  using (
    exists (
      select 1 from shelter_users
      where shelter_users.shelter_id = shelter_documents.shelter_id
      and shelter_users.user_id = auth.uid()
    )
  );
```

Dropped from the original sketch: `document_chunks` table (real ingestion, not being built), `chunk_count` column (would always be null), and the `status` state machine (`'processing'/'error'` never occur — upload succeeding is the only state this system has, so it always defaults to `'ready'`). The column is kept, not removed, so a future real ingestion pipeline has somewhere to write actual state without a migration.

RLS policy mirrors the existing `adoption_requests_shelter_all` convention exactly. Note this is defense-in-depth only: the API routes below use the service-role client (`createServerClient()`), which bypasses RLS, and do not verify the caller's session — matching the existing pattern used by `/api/animals`, `/api/adoption-requests`, and `/api/shelters/[id]` today. This is a known, pre-existing, systemic gap (flagged separately) — this feature follows the established convention rather than introducing a new one or silently fixing it as a side effect.

## Storage

Bucket already exists and is already correctly configured (verified live): `documents`, private, `file_size_limit: 10485760` (10MB), `allowed_mime_types: ["application/pdf"]`. No bucket changes needed.

Path convention: `<shelter_id>/<uuid>.pdf` — random server-side filename, exactly like the existing `pets` bucket convention; the user-supplied `file_name` is stored only as display metadata in the DB row, never used in the storage path.

## API — mint (extend existing endpoint)

`POST /api/uploads` gets a third context. Two new static lookup maps, alongside the existing `FOLDER_BY_CONTEXT`:

- `BUCKET_BY_CONTEXT`: `'lost-found'` → `pets`, `'animal'` → `pets`, `'document'` → `documents`.
- `PUBLIC_BY_CONTEXT`: `'lost-found'` → `true`, `'animal'` → `true`, `'document'` → `false`. (Static, known at code-time — not a runtime lookup against Storage's bucket config — so the response can omit `public_url` with a plain ternary: `PUBLIC_BY_CONTEXT[context] ? storage.getPublicUrl(path).data.publicUrl : null`.)

The `document` context is shelter-scoped, unlike the flat `lost-found/` and `animals/` folders used today: path is `<shelter_id>/<uuid>.pdf`, not `<folder>/<uuid>.pdf`. This means the route needs a small branch — when `context === 'document'`, `shelter_id` is required in the request body and becomes the path prefix instead of the static folder name. This is the one real conditional this task adds to an otherwise lookup-map-driven route; call it out plainly in the implementer brief rather than papering over it as another one-line map entry.

- New content-type entry: `'application/pdf': 'pdf'`.

**Request body (document context):**
```json
{ "content_type": "application/pdf", "context": "document", "shelter_id": "uuid" }
```

**Response 201:**
```json
{
  "upload_url": "https://<project>.supabase.co/storage/v1/object/upload/sign/documents/<shelter_id>/<uuid>.pdf?token=...",
  "public_url": null,
  "storage_path": "<shelter_id>/<uuid>.pdf",
  "expires_in": 7200
}
```

**Spec correction found during planning:** the response needs a new `storage_path` field, returned for every context (harmless addition for the two existing contexts, which derive `public_url` from the same path and don't need to look at it). Without it, a private-bucket caller (the `document` context, where `public_url` is `null`) would have no way to learn the path it just uploaded to, and `POST /api/documents` below requires that exact path to register the row.

## API — register, list, delete (new route)

New file `app/api/documents/route.ts` and `app/api/documents/[id]/route.ts`.

### `POST /api/documents`
Registers a document row after the client's direct `PUT` to the signed URL succeeds. Two-step (mint, then register) rather than one multipart POST through our Vercel Function, because a single request carrying up to a 10MB file body risks Vercel's Serverless Function body-size ceiling (~4.5MB) — the same reasoning already documented for the existing `pets`-bucket upload flow.

**Request body:**
```json
{ "shelter_id": "uuid", "file_name": "politicas_adopcion.pdf", "storage_path": "documents/<shelter_id>/<uuid>.pdf" }
```

**Response 201:**
```json
{ "document": { "id": "uuid", "file_name": "politicas_adopcion.pdf", "status": "ready", "created_at": "2026-07-26T00:00:00Z" } }
```

**Validation:** `shelter_id`, `file_name` (max 255 chars), `storage_path` all required strings → 400 otherwise.

### `GET /api/documents?shelter_id=`
Lists a shelter's documents, newest first.

**Response 200:**
```json
{ "documents": [ { "id": "uuid", "file_name": "politicas_adopcion.pdf", "status": "ready", "created_at": "..." } ], "total": 3 }
```

### `DELETE /api/documents/:id`
Best-effort Storage cleanup (delete the object at the row's `storage_path`) then delete the row. No `shelter_id` ownership check — matches the existing `DELETE /api/animals/:id` convention exactly (delete-by-id only). If the Storage delete fails, the row is still removed and the orphaned object is accepted the same way orphaned upload objects already are elsewhere in this codebase.

**Response 200:**
```json
{ "message": "Document deleted" }
```

## Frontend — `DocumentsManager.tsx`

Stops reading `shelterDocuments` from `lib/mock-data.ts`. New flow:

1. On mount, `GET /api/documents?shelter_id=` to populate the real list.
2. "Choose document" opens a real file picker (`accept="application/pdf"`).
3. On file selection: `POST /api/uploads` (context `document`) → `PUT` the file bytes to `upload_url` → `POST /api/documents` to register → refetch the list.
4. Each row gets a delete action → `DELETE /api/documents/:id` → refetch the list.
5. Remove the fake "Processing timeline" (Upload / Extract text / Index chunks) and the `chunk_count`/"chunks indexed" copy — those implied a pipeline that does not exist. Replace with a plain upload-progress indicator (percentage from the `PUT`'s progress, or a simple spinner if not tracked) and a status badge that only ever reads "Ready" (the field exists in the API response for forward-compatibility, but the UI does not need to render a state machine for a single possible value).
6. Update the "Mock-only upload" copy to reflect reality, or remove it — no longer true.

## Docs to sync (same task, per existing project practice)

- `docs/api-contracts/f1-shelter-hub.md` — new "Shelter Documents" section (this feature lives under F1/Shelter Hub now, not F4, since it has nothing to do with RAG).
- `docs/api-contracts/f3-lost-found.md` — no change, but note the `/api/uploads` contract section there now documents a third context.
- `docs/architecture.md` — add `shelter_documents` table and the new routes to the F1 diagram/reference table; note explicitly that this table is unrelated to the F4 RAG proxy tables (which remain absent by design).
- `public/openapi.yaml` and `docs/pawlink.postman_collection.json` — add the new/changed endpoints.

## Accepted trade-offs (documented, not built)

- **Not wired to RAG.** Uploading here does not inform the chatbot. Explicitly the point of this design (see Scope decision above).
- **No session verification on the new routes.** Matches the existing systemic pattern across shelter-scoped endpoints; not introduced or fixed by this feature.
- **No ownership check on delete.** Matches the existing `DELETE /api/animals/:id` convention.
- **Orphaned Storage objects** if a `PUT` succeeds but `POST /api/documents` (register) is never called, or if a Storage delete fails during document deletion. Same accepted trade-off already documented for the `pets` bucket flow.

## Testing (smoke suite, real infra)

New checks in `scripts/smoke-test.mjs`:
1. `POST /api/uploads` with `context: "document"`, valid PDF content type → 201 with `upload_url`, `public_url: null`.
2. `PUT upload_url` with a real minimal PDF byte payload → 200.
3. `POST /api/documents` (register) → 201 with the created row.
4. `GET /api/documents?shelter_id=` → includes the new document.
5. `POST /api/uploads` with `context: "document"`, `content_type: "image/png"` → 400.
6. `DELETE /api/documents/:id` → 200; subsequent `GET` no longer lists it; underlying Storage object confirmed gone (service role).

## Division of work

Full stack, this repo: schema migration, `app/api/uploads/route.ts` (extended), `app/api/documents/route.ts` + `app/api/documents/[id]/route.ts` (new), `components/shelter/DocumentsManager.tsx` (rewired), contract/architecture/openapi/postman docs, smoke checks. No dependency on Jose or the pawlink-rag teammate for this task.
