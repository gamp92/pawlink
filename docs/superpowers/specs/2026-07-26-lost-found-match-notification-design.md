# Lost & Found Vision Match Notification — Design

**Date:** 2026-07-26
**Status:** Approved by Gabriel (scope, contact-field friction trade-off, and notification recipients confirmed in design session)
**Triggered by:** the "Notify owner" button shown on a vision-match card in the public Lost & Found map is 100% mock — `onNotify={() => setNotifiedReportId(report.id)}` only flips local UI state, no API call happens. Even if it did something, a manual button on a public, no-account page is the wrong shape: the system should notify automatically the moment a match is confirmed, not wait for a random visitor to click a button on someone else's report.

## Problem

`lost_found_reports` has no contact field today — the table only has an optional `reporter_id` (FK to `auth.users`), which is essentially never populated since Lost & Found is deliberately a no-account, low-friction public flow. `POST /api/vision` already sets `matched_report_id` + `match_confidence` on both reports the moment a match is confirmed (either automatically on report creation, per `attemptAutoMatch` in `app/api/lost-found/route.ts`, or via a manual call) — but there is no channel to actually reach either reporter when that happens.

## Scope decision: optional contact field, notify both sides, remove the manual button

Confirmed with Gabriel, not assumed:

- **Contact email is optional**, not required. Keeps friction low on a flow that today doesn't even ask for a name — matches the project's existing "no-account, minimal friction" design principle documented in `CLAUDE.md`. A report with no email still fully participates in vision matching and still shows up on the public map; it just can't be emailed.
- **Notify both sides**, not just the "lost" owner. Whichever report just got its `matched_report_id` set gets checked for its own `contact_email` — if present, that reporter gets an email about the *other* report. Since `/api/vision` updates both rows in the same call, this falls out naturally with no extra coordination (see Architecture below).
- **Remove the manual button entirely.** Replace it with a static line of copy — no interactive element, since there is nothing left for a visitor to click once notification is automatic.

## Architecture: Database Webhook → Edge Function (same pattern as `geo-alert` / `adoption-confirmation`)

Considered and rejected: sending the email synchronously from inside `/api/vision` itself. Two reasons this loses:
1. It breaks the codebase's existing convention that **every outbound email goes through an async Edge Function triggered by a Database Webhook** — `geo-alert` and `adoption-confirmation` both work this way; making this one email synchronous would be the only exception, for no real benefit.
2. `/api/vision` already shares its 10-second Vercel Function budget with a real Rekognition network call. Adding up to two more outbound Resend calls inline is unnecessary risk to a function that's already time-constrained.

Chosen approach: a new Database Webhook on `UPDATE` to `lost_found_reports`, triggering a new Edge Function `vision-match-notification`. Because `/api/vision` updates both matched rows in one request, this webhook fires once per row — each firing is independently responsible for checking whether *its own* row's `contact_email` is set, and if so, emailing that reporter with details of the *other* (matched) report. No cross-row coordination needed; the natural double-fire handles "notify both sides" for free.

**Idempotency guard**, mirroring `adoption-confirmation`'s existing pattern (`request?.status !== 'approved' || oldRequest?.status === 'approved'`):
```
only proceed when: old_record.matched_report_id IS NULL AND record.matched_report_id IS NOT NULL
```
This ensures the notification fires exactly once per report, the moment it first gets matched — not on every subsequent update (e.g., a later `PATCH .../resolved` must not re-trigger it).

## Schema change

```sql
alter table lost_found_reports add column contact_email text;
```
Nullable, no default. No RLS/policy change needed — `lost_found_reports` already allows public insert or this column would be unreachable from the public form; existing `lost_found_public_insert`/`lost_found_public_read` policies already cover all columns on the table.

## API contract — `POST /api/lost-found`

New optional field:
```json
{ "contact_email": "ana@gmail.com" }
```
**Validation:** if present, must match the same email pattern already used by `POST /api/alert-subscriptions` (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), max 255 chars. Omit entirely if not provided — do not send `null` or empty string (matches how other optional fields on this endpoint already behave, e.g. `pet_name`).

`GET /api/lost-found` does **not** return `contact_email` in the response — it's never displayed publicly, only read server-side by the new Edge Function. (Same privacy posture as `alert_subscriptions.unsubscribe_token`, which the existing docs explicitly say "must never leave the server except inside alert emails.")

## Edge Function — `vision-match-notification`

New file `supabase/functions/vision-match-notification/index.ts`, structured identically to `adoption-confirmation/index.ts`:
1. Guard: only proceed if `matched_report_id` just transitioned from null to non-null (see above).
2. Guard: skip silently (200, no error) if `record.contact_email` is null — this is the expected, common case for reports that opted out.
3. Fetch the matched report's `pet_name`, `species`, `report_type` via `matched_report_id`.
4. Send via Resend: subject like `"¡Posible match para tu reporte!"`, body naming the matched pet/species and pointing back to the public Lost & Found map. Same `escapeHtml` treatment on all interpolated fields as the existing Edge Functions use (XSS prevention in the HTML email body).
5. Same `RESEND_FROM` env var and sandbox-sender caveat as `adoption-confirmation` — reusing infrastructure already in place, no new Resend setup needed.

## Frontend changes

- `components/public/lost-found/types.ts`: add `contact_email?: string` to `LostFoundReportForm` and `AnonymousLostFoundReportPayload`.
- Report form (`ReportPetFlow.tsx`): add the optional field to the existing **review** step (the last step before submit) — not a new step. Copy: *"¿Quieres que te avisemos por email si encontramos un match? (opcional)"*. No new step keeps the flow exactly as low-friction as it is today for anyone who wants to skip it.
- `LostFoundBoard.tsx`: remove the `onNotify`/`notifiedReportId` state and the "Notify owner" button entirely. Replace the vision-match card's action area with a static line: *"Ambos lados reciben un email automático si dejaron su contacto."* No per-report conditional copy (e.g., don't say "this specific report has/hasn't got an email on file") — that would leak whether a stranger's report has a contact email, which is exactly the kind of information the API contract above already says must never reach the public response.

## Accepted trade-offs (documented, not built)

- **No delivery confirmation UI.** The public map has no way to show "the email was sent" vs. "no email was on file" — both look identical from the outside, by design (privacy).
- **No re-send capability.** If the automatic email fails or lands in spam, there's no manual retry button anymore (that's the whole point — the manual button is gone). Matches the same accepted-risk posture as `geo-alert`'s existing best-effort email delivery.
- **Same Resend sandbox-sender limitation** already documented for `adoption-confirmation` — until a custom domain is verified in Resend, delivery is only guaranteed to the account owner's own address. Same caveat applies here; not a new risk, but doubles the number of email flows subject to it.

## Testing (smoke suite, real infra)

Extend `scripts/smoke-test.mjs`'s existing vision-matching checks (automated, part of the regular suite):
1. `POST /api/lost-found` with a valid `contact_email` set → 201, report created normally.
2. `POST /api/lost-found` with an invalid `contact_email` (e.g., `"not-an-email"`) → 400.
3. Create two throwaway reports with `contact_email` set on both (one lost, one found, same photo, matching the existing `checkVision` pattern) → confirm the auto-match still fires and sets `matched_report_id` on both, exactly as it does today — the new column must not interfere with matching.
4. `GET /api/lost-found` → assert the response never includes `contact_email` in any report object, for any report (including the ones just created with it set).
5. Cleanup as usual via service role.

Not automated — verify manually once, the same way `geo-alert` and `adoption-confirmation` were verified in earlier work on this project: submit one real report with a real inbox as `contact_email`, trigger a match against it, and confirm the email actually arrives. Check the Edge Function's logs (`mcp__claude_ai_Supabase__get_logs`) to confirm it fired and returned 200 for both rows.

## Division of work

Full stack, this repo: schema migration, `app/api/lost-found/route.ts` (validation only — no other change needed, since `attemptAutoMatch`/`/api/vision` already do the matching itself), new Edge Function (must be deployed manually per `CLAUDE.md`'s Edge Function rule — not auto-deployed on push), `components/public/lost-found/types.ts` + `ReportPetFlow.tsx` + `LostFoundBoard.tsx`, contract/architecture docs, smoke checks.
