# Anonymous Photo Upload for Lost & Found Reports — Design

**Date:** 2026-07-19
**Status:** Approved by Gabriel (mechanism, scope, and trade-offs confirmed in design session)
**Unblocks:** Jose's `PetPhotoUploader` (currently disabled with a TODO) and Rekognition vision matching for user-created reports.

## Problem

`POST /api/lost-found` has always expected `photo_urls` to be pre-uploaded to Supabase Storage, but no upload mechanism exists for anonymous users. Seeded reports show photos only because the seed injects Unsplash URLs. Reports created through the web form have no photos, which leaves the map cards empty and gives `/api/vision` (Rekognition) nothing to compare.

## Scope

**Lost & Found only.** Shelter dashboard animal-photo upload is explicitly out of scope: it must ride on shelter API authentication, which does not exist yet (known gap). The endpoint is designed so an authenticated variant can be added later without changing this contract.

## Decision: signed upload URL (browser uploads directly to Supabase)

Chosen over proxying the file through a Vercel Function because:

- No 4.5 MB Vercel request-body limit (phone photos approach the bucket's 5 MB cap).
- The file travels once (browser → Supabase), not twice.
- The `pets` bucket already enforces the real validation at the door: `file_size_limit` 5 MB, `allowed_mime_types` = `image/jpeg`, `image/png`, `image/webp` (verified live).

Mechanics: the Vercel route holds the service role key and asks **Supabase itself** to mint a single-path, expiring signed upload URL. The browser PUTs the file to that URL; Supabase verifies its own cryptographic signature. Nothing about the token can be forged or altered.

## Contract — `POST /api/uploads`

One request per photo. To be added to `docs/api-contracts/f3-lost-found.md`.

**Request body:**
```json
{ "file_name": "foto.jpg", "content_type": "image/jpeg" }
```

**Validation:**
- `content_type` required, must be exactly one of `image/jpeg`, `image/png`, `image/webp` → otherwise 400.
- `file_name` optional metadata (max 255 chars if present); **never used in the storage path**.

**Behavior:**
- Storage path: `lost-found/<uuid>.<ext>` in the public `pets` bucket. Extension derived from `content_type` (`jpg`/`png`/`webp`), never from the user's file name.
- Signed upload URL minted via the service-role client (`createSignedUploadUrl`).

**Response 201:**
```json
{
  "upload_url": "https://<project>.supabase.co/storage/v1/object/upload/sign/pets/lost-found/<uuid>.jpg?token=...",
  "public_url": "https://<project>.supabase.co/storage/v1/object/public/pets/lost-found/<uuid>.jpg",
  "expires_in": 7200
}
```

**Client flow (Jose):** for each selected photo → `POST /api/uploads` → `PUT upload_url` with the file bytes and `Content-Type` header → collect `public_url` → submit the report with `photo_urls: [public_url, ...]`. `POST /api/lost-found` is unchanged.

**Errors:** static safe strings only (`{"error": "content_type must be image/jpeg, image/png or image/webp"}`, `{"error": "Could not create upload URL"}`). Never raw Supabase `error.message`.

## Integration notes

- `/api/vision`'s SSRF allowlist already includes the project's Supabase hostname — public storage URLs pass without changes.
- The public bucket means anyone with the URL can view the photo. Acceptable: these photos are public by nature (they appear on a public map).

## Accepted trade-offs (documented, not built)

- **Orphaned uploads:** a photo uploaded for a report that is never submitted stays in the bucket. Accepted for MVP; a cleanup job is future work.
- **No rate limiting:** same status as every other public POST — on the team's deferred list (Vercel WAF vs Upstash decision).

## Testing (smoke suite, real infra)

New checks in `scripts/smoke-test.mjs`:
1. `POST /api/uploads` with valid `content_type` → 201 with `upload_url` + `public_url`.
2. `PUT upload_url` with a real 1×1 PNG byte payload → 200.
3. `GET public_url` → 200 with image content-type (the photo is truly public).
4. `POST /api/uploads` with `content_type: "application/pdf"` → 400.
5. Cleanup: delete the uploaded object via service role → verify gone.

## Division of work

- **Backend (this repo, Gabriel/Claude):** route `app/api/uploads/route.ts`, contract section in f3, smoke checks.
- **Frontend (Jose):** reconnect `PetPhotoUploader` in `ReportPetFlow` per the client flow above — flagged in the PR body.
