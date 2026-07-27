# Lost & Found Vision Match Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake "Notify owner" button on Lost & Found vision-match cards with a real, automatic email notification sent the moment a match is confirmed.

**Architecture:** Add an optional `contact_email` column to `lost_found_reports`. A new Database Webhook (Postgres trigger calling `supabase_functions.http_request`, same mechanism as the existing `geo-alert`/`adoption-confirmation` workflows) fires on every `UPDATE` to `lost_found_reports`, invoking a new Edge Function `vision-match-notification`. Because `POST /api/vision` already issues two separate `UPDATE` statements (one per matched row) when a match is confirmed, the trigger fires once per row — each firing independently checks its own row's `contact_email` and, if present, emails that reporter about the *other* (matched) report. No cross-row coordination needed.

**Tech Stack:** Next.js 14 API routes, Supabase Postgres (trigger + `supabase_functions.http_request`), Supabase Edge Functions (Deno), Resend, React (public Lost & Found components).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-26-lost-found-match-notification-design.md` — read it if anything below is ambiguous.
- `contact_email` is **optional** on report submission — never required. A report with no email fully participates in matching and still appears on the public map.
- Notify **both sides** if each left an email — this falls out automatically from the per-row webhook firing; do not add cross-row lookup logic.
- **Never return `contact_email` in any `GET /api/lost-found` response.** It must stay server-side only, same privacy posture as `alert_subscriptions.unsubscribe_token`.
- The manual "Notify owner" button is **removed entirely** — replaced with a static, non-interactive line of copy. No per-report conditional copy that could reveal whether a specific report has an email on file (privacy).
- Edge Functions are **not auto-deployed** — must run `supabase functions deploy vision-match-notification` manually after creating the file (per `CLAUDE.md`).
- Reuse the existing `RESEND_API_KEY` / `RESEND_FROM` secrets — no new Resend setup.
- Docs that must stay in sync with the code: `docs/api-contracts/f3-lost-found.md`, `docs/architecture.md`, `public/openapi.yaml`, `docs/pawlink.postman_collection.json`.

---

### Task 1: Schema column + `vision-match-notification` Edge Function + Database Webhook trigger

**Files:**
- Modify: `docs/schema.sql` (add `contact_email` column to `lost_found_reports`)
- Create: `supabase/functions/vision-match-notification/index.ts`
- Modify: `docs/architecture.md` (async workflows section, `~line 274-312`)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `lost_found_reports.contact_email` column (nullable text) — Task 2's API route reads/writes it; Task 3's frontend collects it. The Edge Function itself is invoked by the trigger, not called directly by any other task's code.

- [ ] **Step 1: Apply the schema + trigger migration**

Run this SQL via `mcp__claude_ai_Supabase__apply_migration` (`project_id: "etxjyvjrinsvrnzqwmpf"`, migration name `add_lost_found_contact_email_and_webhook`):

```sql
alter table lost_found_reports add column contact_email text;

create trigger on_lost_found_matched
  after update on lost_found_reports
  for each row execute function supabase_functions.http_request(
    'https://etxjyvjrinsvrnzqwmpf.supabase.co/functions/v1/vision-match-notification',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '5000'
  );
```

This mirrors the exact trigger shape already used for `adoption-confirmation` (verified live: `on_adoption_approved` is an `AFTER UPDATE` trigger calling `supabase_functions.http_request(...)` with the same argument shape) — the Edge Function itself decides whether to act, using `old_record`/`record` from the webhook payload, not a SQL `WHEN` clause.

- [ ] **Step 2: Verify the migration**

Run via `mcp__claude_ai_Supabase__execute_sql`:
```sql
select column_name, is_nullable from information_schema.columns
where table_name = 'lost_found_reports' and column_name = 'contact_email';
```
Expected: one row, `is_nullable: YES`.

```sql
select trigger_name, event_manipulation from information_schema.triggers
where event_object_table = 'lost_found_reports' and trigger_name = 'on_lost_found_matched';
```
Expected: one row, `event_manipulation: UPDATE`.

- [ ] **Step 3: Sync `docs/schema.sql`**

Find the `lost_found_reports` table definition (`~line 152-171`) and add the new column right after `match_confidence`:

```sql
  matched_report_id     uuid references lost_found_reports(id),
  match_confidence      numeric(5,2),          -- 0.00 to 100.00
  contact_email         text,                  -- optional, for automatic match notification
  created_at      timestamptz default now(),
```

Add a comment near the bottom of the F3 section of `schema.sql` (wherever the other Database Webhook triggers would be documented — this repo's convention is that webhook triggers are NOT written into `schema.sql` as SQL, since they were historically created via the Supabase Dashboard; add a plain SQL comment noting this one exists, so a future reader of `schema.sql` knows to look at the live database, not just this file, for the full trigger definition):

```sql
-- Database Webhook trigger `on_lost_found_matched` (AFTER UPDATE on lost_found_reports,
-- invokes Edge Function vision-match-notification) exists live in Supabase but is not
-- expressed here — see docs/architecture.md section 4 for the full async-workflow picture.
```

- [ ] **Step 4: Create `supabase/functions/vision-match-notification/index.ts`**

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const RESEND_API_URL = 'https://api.resend.com/emails'

// Sender must belong to a domain verified in Resend. Without a verified domain,
// only Resend's sandbox sender works — and it only delivers to the account owner.
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Pawlink <onboarding@resend.dev>'

// Triggered by Supabase Database Webhook on UPDATE to lost_found_reports.
// POST /api/vision updates BOTH matched rows in separate UPDATE statements when
// a match is confirmed, so this webhook fires once per row — each firing checks
// only its OWN row's contact_email and notifies about the OTHER (matched) report.
// No cross-row coordination needed.
Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const record = payload.record
  const oldRecord = payload.old_record

  // Only fire the moment matched_report_id first transitions from null to set
  if (!record?.matched_report_id || oldRecord?.matched_report_id) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  if (!record.contact_email) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no contact_email on this report' }), { status: 200 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 503 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: matchedReport } = await supabase
    .from('lost_found_reports')
    .select('pet_name, species')
    .eq('id', record.matched_report_id)
    .single()

  const species = matchedReport?.species === 'dog' ? 'perro' : matchedReport?.species === 'cat' ? 'gato' : 'mascota'
  const petName = matchedReport?.pet_name || 'la mascota'

  const emailResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: record.contact_email,
      subject: `¡Posible match para tu reporte!`,
      html: `
        <h2>¡Buenas noticias!</h2>
        <p>Encontramos un posible match para tu reporte: <strong>${escapeHtml(petName)}</strong> (${species}).</p>
        <p>Entra a Pawlink para ver el detalle y coordinar el reencuentro.</p>
        <p><a href="https://pawlink-theta.vercel.app/lost-found">Ver en Pawlink</a></p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    const body = await emailResponse.text().catch(() => '(unreadable body)')
    console.error(`vision-match-notification: Resend rejected email to ${record.contact_email}: ${emailResponse.status} ${body}`)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 })
  }

  return new Response(
    JSON.stringify({ success: true, email_sent_to: record.contact_email }),
    { status: 200 }
  )
})
```

- [ ] **Step 5: Deploy the Edge Function**

Run: `supabase functions deploy vision-match-notification`

Expected: deploy succeeds, no errors. (Requires the Supabase CLI to already be authenticated against this project — same as prior Edge Function deploys in this repo.)

- [ ] **Step 6: Update `docs/architecture.md`**

Change the intro sentence at `~line 276` from:
```markdown
Three workflows fire on database events. Edge Function code lives in `supabase/functions/<name>/index.ts` and must be deployed manually (`supabase functions deploy <name>`) — it does not auto-deploy on push.
```
to:
```markdown
Four workflows fire on database events. Edge Function code lives in `supabase/functions/<name>/index.ts` and must be deployed manually (`supabase functions deploy <name>`) — it does not auto-deploy on push.
```

Add a fourth `rect` block to the mermaid sequence diagram (`~line 278-312`), right after the `adoption-confirmation` block and before the closing ` ``` `:

```mermaid
    rect rgba(128, 128, 128, 0.05)
        Note over DB,Resend: vision-match-notification — UPDATE lost_found_reports → matched_report_id set
        DB->>WH: UPDATE matched_report_id (fires once per matched row)
        WH->>EF: invoke vision-match-notification
        EF->>DB: read contact_email on this row<br/>+ matched report's pet_name/species
        DB-->>EF: email (if present), matched pet details
        EF->>Resend: match email to this row's reporter<br/>(skipped if no contact_email)
    end
```

- [ ] **Step 7: Commit**

```bash
git checkout -b feat/lost-found-match-notification
git add docs/schema.sql supabase/functions/vision-match-notification docs/architecture.md
git commit -m "feat: add contact_email column and vision-match-notification Edge Function"
```

---

### Task 2: Backend API validation + contract docs + smoke tests

**Files:**
- Modify: `app/api/lost-found/route.ts`
- Modify: `docs/api-contracts/f3-lost-found.md`
- Modify: `public/openapi.yaml`
- Modify: `docs/pawlink.postman_collection.json`
- Modify: `scripts/smoke-test.mjs`

**Interfaces:**
- Consumes: `lost_found_reports.contact_email` column from Task 1.
- Produces: `POST /api/lost-found` accepts optional `contact_email` in its request body (validated, same email regex already used by `alert-subscriptions`). `GET /api/lost-found` continues to never include `contact_email` in any report object (already true today via the existing explicit `select()` column list — this task adds a regression-guarding smoke check for it, not a code change).

- [ ] **Step 1: Write the failing smoke checks**

Open `scripts/smoke-test.mjs`. Find `checkLostFoundLifecycle()` (`~line 201-243`). Add these new checks right after the existing `POST /api/lost-found (Madrid) → 201` check (after the line `record(created.status === 201, 'POST /api/lost-found (Madrid) → 201')`) and before the `try` block starts, by wrapping the new checks into the existing `try` block right after the report is created — insert this immediately after that `record(...)` line, still inside the function, before `const reportId = created.json?.report?.id`:

Actually — since a new report is needed with `contact_email` specifically for these checks (the existing `created` report doesn't send one), add a **new, separate function** instead of editing `checkLostFoundLifecycle`. Add this new function immediately after `checkLostFoundLifecycle`'s closing `}` (after line 243):

```js
// ── Lost & Found match notification: contact_email validation + privacy ────

async function checkLostFoundContactEmail() {
  console.log('\nNotificación de match en Lost & Found (contact_email):')

  const withEmail = await api('POST', '/api/lost-found', {
    report_type: 'lost', species: 'dog', color: 'negro',
    description: 'Smoke test contact_email', location: { lat: 10, lng: -60 },
    location_notes: 'Smoke test', city: 'smoke-test',
    contact_email: 'test+smokematch@gmail.com',
  })
  record(withEmail.status === 201, 'POST /api/lost-found con contact_email válido → 201')
  const reportId = withEmail.json?.report?.id

  const badEmail = await api('POST', '/api/lost-found', {
    report_type: 'lost', species: 'dog', color: 'negro',
    description: 'Smoke test bad email', location: { lat: 10, lng: -60 },
    location_notes: 'Smoke test', city: 'smoke-test',
    contact_email: 'not-an-email',
  })
  record(badEmail.status === 400, 'POST /api/lost-found con contact_email inválido → 400')

  if (!reportId) return

  try {
    const list = await api('GET', '/api/lost-found?limit=50')
    const found = list.json?.reports?.find((r) => r.id === reportId)
    record(Boolean(found) && !('contact_email' in found), 'GET /api/lost-found nunca incluye contact_email', JSON.stringify(Object.keys(found ?? {})))
  } finally {
    if (hasServiceAccess) {
      const del = await supaRest('DELETE', `lost_found_reports?id=eq.${reportId}`)
      record(del.status === 204, 'cleanup reporte con contact_email (via service role)')
    } else {
      skip('cleanup reporte con contact_email', 'sin service role')
    }
  }
}
```

Then, inside `async function main() { ... }`, find the line `await checkLostFoundLifecycle()` and add immediately after it:
```js
  await checkLostFoundContactEmail()
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run dev` (one terminal), then: `node scripts/smoke-test.mjs http://localhost:3000`

Expected: "POST /api/lost-found con contact_email válido → 201" still passes (the field is silently ignored by Postgres today via `insert({..., ...rest})` since `contact_email` isn't in the current validation but the column now exists after Task 1 — actually check: since the column exists after Task 1's migration and the route spreads `...rest` directly into `.insert()`, this may already pass before any code change in this task). The "contact_email inválido → 400" check FAILS (no validation exists yet, invalid email is accepted as plain text).

- [ ] **Step 3: Add validation to `app/api/lost-found/route.ts`**

Read the file first. In the `POST` handler, after the existing required-field check (`if (!report_type || !species || ...)`) and before `if (!['lost', 'found'].includes(report_type))`, add:

```ts
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (rest.contact_email != null && (typeof rest.contact_email !== 'string' || !EMAIL_PATTERN.test(rest.contact_email))) {
    return NextResponse.json({ error: 'contact_email must be a valid email address' }, { status: 400 })
  }
```

(`rest` already exists in scope — it's the destructured remainder from `const { report_type, species, location, ...rest } = body` a few lines above, and is already spread into the `.insert()` call, so no other code change is needed for the field to actually persist.)

- [ ] **Step 4: Run the smoke checks again to confirm they pass**

Run: `node scripts/smoke-test.mjs http://localhost:3000`

Expected: all three new "Notificación de match" lines pass, and the full suite's total count increases with no failures elsewhere.

- [ ] **Step 5: Update `docs/api-contracts/f3-lost-found.md`**

Find the `POST /api/lost-found` section's request body example (`~line 58-75`) and add `contact_email` to it:

```json
{
  "report_type": "lost",
  "pet_name": "Max",
  "species": "dog",
  "breed": "Golden Retriever",
  "color": "golden",
  "description": "Last seen near Parque México wearing a red collar",
  "photo_urls": ["https://..."],
  "location": {
    "lat": 19.4284,
    "lng": -99.1277
  },
  "location_notes": "Near Parque México, Condesa",
  "city": "CDMX",
  "contact_email": "ana@gmail.com"
}
```

Add to the **Notes** list right below it:
```markdown
- `contact_email` is optional. If provided, you'll receive an automatic email if this report is later matched to another one via `/api/vision`. It is never returned by `GET /api/lost-found` — server-side only, same privacy posture as an unsubscribe token.
```

Update the **"Side effects on creation"** list to add a third item:
```markdown
3. If this report is later matched to another (via `/api/vision`), a Database Webhook fires on the `UPDATE` and triggers the `vision-match-notification` Edge Function, which emails `contact_email` (if provided) with the matched report's details.
```

Add an error example to the existing error block:
```json
{ "error": "contact_email must be a valid email address" }
```

- [ ] **Step 6: Update `public/openapi.yaml`**

In the `/api/lost-found` POST request body schema (`~line 366-380`), add:
```yaml
                contact_email: { type: string, format: email, description: Opcional. Recibe un email automático si este reporte hace match más tarde. Nunca se devuelve en GET. }
```

Update the POST's `description` field (`~line 354-357`) to mention the new side effect:
```yaml
      description: >
        Side effect: el INSERT dispara un Database Webhook → Edge Function `geo-alert` →
        emails via Resend a suscriptores de alertas (alert_subscriptions) en un radio de 2 km.
        Si más tarde se confirma un match vía /api/vision, otro Database Webhook dispara
        `vision-match-notification`, que envía un email a `contact_email` (si se proporcionó).
        Las fotos deben subirse a Storage antes; aquí solo van las URLs.
```

- [ ] **Step 7: Update `docs/pawlink.postman_collection.json`**

Find the `"POST /api/lost-found"` item (`~line 170-180`) and update its body to include `contact_email`:
```json
"raw": "{\n  \"report_type\": \"lost\",\n  \"pet_name\": \"Max\",\n  \"species\": \"dog\",\n  \"breed\": \"Golden Retriever\",\n  \"color\": \"dorado\",\n  \"description\": \"Perdido cerca del Parque México con collar rojo\",\n  \"photo_urls\": [],\n  \"location\": {\n    \"lat\": 19.4117,\n    \"lng\": -99.1727\n  },\n  \"location_notes\": \"Cerca de Parque México, Condesa\",\n  \"city\": \"Ciudad de México\",\n  \"contact_email\": \"ana@gmail.com\"\n}"
```

- [ ] **Step 8: Validate the docs are syntactically correct**

Run:
```bash
node -e "require('js-yaml').load(require('fs').readFileSync('public/openapi.yaml', 'utf8')); console.log('openapi.yaml OK')"
node -e "JSON.parse(require('fs').readFileSync('docs/pawlink.postman_collection.json', 'utf8')); console.log('postman OK')"
```
Expected: both print `OK`.

- [ ] **Step 9: Commit**

```bash
git add app/api/lost-found/route.ts docs/api-contracts/f3-lost-found.md public/openapi.yaml docs/pawlink.postman_collection.json scripts/smoke-test.mjs
git commit -m "feat: validate contact_email on POST /api/lost-found, keep it out of GET responses"
```

---

### Task 3: Frontend — contact field on the report form, remove the fake button

**Files:**
- Modify: `components/public/lost-found/types.ts`
- Modify: `components/public/lost-found/lost-found-report-adapter.ts`
- Create: `components/public/lost-found/ContactEmailField.tsx`
- Modify: `components/public/lost-found/ReportPetFlow.tsx`
- Modify: `components/public/LostFoundBoard.tsx`

**Interfaces:**
- Consumes: `POST /api/lost-found`'s `contact_email` field from Task 2.
- Produces: nothing consumed by other tasks — this is the last task in the plan.

- [ ] **Step 1: Add `contact_email` to the form and payload types**

Read `components/public/lost-found/types.ts` first. Add `contact_email: string` to `LostFoundReportForm` (after `photos: SelectedPetPhoto[]`):

```ts
export type LostFoundReportForm = {
  report_type: ReportType
  pet_name: string
  species: Species | ''
  breed: string
  color: string
  description: string
  location_notes: string
  city: string
  location: SelectedLocation | null
  photos: SelectedPetPhoto[]
  contact_email: string
}
```

Add `contact_email?: string` to `AnonymousLostFoundReportPayload` (after `photo_urls?: string[]`):

```ts
export type AnonymousLostFoundReportPayload = {
  report_type: ReportType
  pet_name?: string
  species: Species
  breed?: string
  color: string
  description: string
  location_notes: string
  city?: string
  location: {
    lat: number
    lng: number
  }
  photo_urls?: string[]
  contact_email?: string
}
```

Add `contact_email: ''` to `initialLostFoundReportForm`:

```ts
export const initialLostFoundReportForm: LostFoundReportForm = {
  report_type: 'lost',
  pet_name: '',
  species: '',
  breed: '',
  color: '',
  description: '',
  location_notes: '',
  city: '',
  location: null,
  photos: [],
  contact_email: '',
}
```

- [ ] **Step 2: Wire the field into the adapter's payload mapping**

Read `components/public/lost-found/lost-found-report-adapter.ts` first. Add `contact_email?: string` to the `LostFoundReportApiPayload` type (after `photo_urls?: string[]`):

```ts
export type LostFoundReportApiPayload = {
  report_type: ReportType
  species: Species
  location: {
    lat: number
    lng: number
  }
  pet_name?: string
  breed?: string
  color: string
  description: string
  location_notes: string
  city?: string
  photo_urls?: string[]
  contact_email?: string
}
```

In `mapLostFoundReportToApi`, add `contact_email` to the returned object (after `city: form.city.trim() || undefined,`):

```ts
  return {
    report_type: form.report_type,
    species: form.species,
    pet_name: form.pet_name.trim() || undefined,
    breed: form.breed.trim() || undefined,
    color: form.color.trim(),
    description: form.description.trim(),
    location_notes: form.location_notes.trim(),
    city: form.city.trim() || undefined,
    contact_email: form.contact_email.trim() || undefined,
    location: {
      lat: form.location.lat,
      lng: form.location.lng,
    },
  }
```

- [ ] **Step 3: Create `components/public/lost-found/ContactEmailField.tsx`**

```tsx
import type { LostFoundReportForm } from '@/components/public/lost-found/types'

// Optional contact field shown on the report's review step — if left blank,
// the report still submits normally, it just can't be emailed if it's later
// matched via vision search.
export function ContactEmailField({
  form,
  onChange,
}: {
  form: LostFoundReportForm
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="lost-found-contact-email" className="block text-sm font-black text-slate-950">
        Want us to email you if we find a match? (optional)
      </label>
      <input
        id="lost-found-contact-email"
        type="email"
        value={form.contact_email}
        onChange={(event) => onChange(event.target.value)}
        placeholder="you@email.com"
        maxLength={255}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-violet-400"
      />
    </div>
  )
}
```

- [ ] **Step 4: Wire it into `ReportPetFlow.tsx`'s review step**

Read the file first (already read in planning — current review-step render is at `~line 272`: `{step === 'review' ? <LostFoundReportReview form={form} onEdit={setStep} /> : null}`).

Add the import (alongside the other `lost-found` component imports, e.g. after the `LostFoundReportReview` import):
```ts
import { ContactEmailField } from '@/components/public/lost-found/ContactEmailField'
```

Replace the review-step render line with:
```tsx
              {step === 'review' ? (
                <>
                  <LostFoundReportReview form={form} onEdit={setStep} />
                  <ContactEmailField form={form} onChange={(value) => updateField('contact_email', value)} />
                </>
              ) : null}
```

- [ ] **Step 5: Remove the fake "Notify owner" button from `LostFoundBoard.tsx`**

Read the file first. Remove the `notifiedReportId` state declaration (currently `const [notifiedReportId, setNotifiedReportId] = useState<string | null>(null)`).

In the `ReportCard` invocation, remove the `onNotify` and `notified` props (keep `matchedReport`):
```tsx
                <ReportCard
                  key={report.id}
                  report={report}
                  distance={distanceFor(index)}
                  timeAgo={timeAgoFor(index)}
                  selected={selectedReport?.id === report.id}
                  onSelect={() => selectReport(report)}
                  matchedReport={report.matched_report_id ? reports.find((item) => item.id === report.matched_report_id) ?? null : null}
                />
```

In the `ReportCard` function's props destructure and type, remove `onNotify` and `notified`:
```tsx
function ReportCard({
  report,
  distance,
  timeAgo,
  selected,
  onSelect,
  matchedReport,
}: {
  report: LostFoundReport
  distance: string
  timeAgo: string
  selected: boolean
  onSelect: () => void
  matchedReport: LostFoundReport | null
}) {
```

Replace the vision-match block's conditional button/notified section with a static line:
```tsx
            {showVision ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-sm font-black text-violet-900">Vision match found</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Possible match with {matchedReport.pet_name} at {report.match_confidence}% confidence.
                </p>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-600">
                  Both sides receive an automatic email if they left their contact info.
                </div>
              </div>
            ) : null}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. (No ESLint config in this repo — do not run `npx next lint`, it hangs on an interactive scaffold prompt.)

- [ ] **Step 7: Real browser verification**

This is a public feature with no auth wall, so no shelter provisioning is needed. Start a local dev server (`npm run dev`) and, using the claude-in-chrome browser tools:
1. Navigate to `/lost-found`, open "Report a pet", fill the required steps, and on the review step confirm the new "Want us to email you..." field renders and accepts input.
2. Submit the report with a test email filled in, confirm it succeeds.
3. Navigate to a report that already has a `matched_report_id` set (use one of the existing seeded/matched reports, or create a throwaway matched pair via direct API calls like the smoke test does) and confirm the vision-match card now shows the static "Both sides receive an automatic email..." line with **no button**.
4. Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add components/public/lost-found/types.ts components/public/lost-found/lost-found-report-adapter.ts components/public/lost-found/ContactEmailField.tsx components/public/lost-found/ReportPetFlow.tsx components/public/LostFoundBoard.tsx
git commit -m "feat: collect optional contact email on Lost & Found reports, remove fake Notify owner button"
```
