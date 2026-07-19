# F3 — Lost & Found API Contracts

Public endpoints — no auth required to read or submit reports.
Auth optional — if logged in, reporter_id is saved for future updates.

---

## Reports

### GET /api/lost-found
Returns all open reports. Used for the map view.

**Query params:**
```
status        string   optional — 'open' | 'resolved' — default 'open'
report_type   string   optional — 'lost' | 'found'
lat           float    optional — center latitude for radius filter
lng           float    optional — center longitude for radius filter
radius_m      float    optional — radius in meters — default 5000 (5km)
limit         int      optional — default 50
```

**Response 200:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "report_type": "lost",
      "pet_name": "Max",
      "species": "dog",
      "breed": "Golden Retriever",
      "color": "golden",
      "description": "Last seen near Parque México",
      "photo_urls": ["https://..."],
      "location": {
        "lat": 19.4284,
        "lng": -99.1277
      },
      "location_notes": "Near Parque México, Condesa",
      "city": "CDMX",
      "status": "open",
      "matched_report_id": null,
      "match_confidence": null,
      "created_at": "2025-06-09T00:00:00Z"
    }
  ],
  "total": 12
}
```

---

### POST /api/lost-found
Submits a new lost or found pet report.
Triggers two side effects: geo-alert to nearby users and vision matching.

**Request body:**
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
  "city": "CDMX"
}
```

**Notes:**
- `photo_urls` must be pre-uploaded to Supabase Storage before calling this endpoint
- `location` is set by the user clicking the Leaflet map — not real GPS
- `pet_name` is optional for `found` reports (unknown pet)

**Response 201:**
```json
{
  "report": {
    "id": "uuid",
    "report_type": "lost",
    "status": "open",
    "created_at": "2025-06-09T00:00:00Z"
  },
  "message": "Report submitted. Nearby users will be alerted automatically."
}
```

**Side effects on creation:**
1. Supabase Database Webhook triggers `geo-alert` Edge Function → calls `get_users_near_report()` PostGIS function → sends email alerts to alert subscribers within 2km via Resend (see Alert Subscriptions below)
2. `/api/vision` is called automatically to compare against existing open reports

---

### PATCH /api/lost-found/:id
Updates a report — typically to mark it as resolved.

**Auth:** Required — only the original reporter can update.

**Request body:**
```json
{
  "status": "resolved"
}
```

**Response 200:**
```json
{
  "report": { "id": "uuid", "status": "resolved", "updated_at": "..." }
}
```

---

## Photo Uploads

### POST /api/uploads
Mints a single-use signed upload URL so an anonymous user can upload one report photo
directly to Supabase Storage (public `pets` bucket). One request per photo.

**Auth:** None. Public endpoint.

**Request body:**
```json
{ "file_name": "foto.jpg", "content_type": "image/jpeg" }
```

**Validation:**
- `content_type` required — exactly `image/jpeg`, `image/png` or `image/webp`
- `file_name` optional metadata, max 255 chars — never used in the storage path

**Response 201:**
```json
{
  "upload_url": "https://<project>.supabase.co/storage/v1/object/upload/sign/pets/lost-found/<uuid>.jpg?token=...",
  "public_url": "https://<project>.supabase.co/storage/v1/object/public/pets/lost-found/<uuid>.jpg",
  "expires_in": 7200
}
```

**Client flow (per photo):**
1. `POST /api/uploads` with the file's `content_type`
2. `PUT upload_url` with the raw file bytes and a `Content-Type` header
3. Collect `public_url` and submit the report with `photo_urls: [public_url, ...]`

**Notes:**
- The bucket enforces max 5MB and image mime types at upload time; the token expires in 2 hours and only works for its one path
- Photos uploaded for reports that are never submitted stay in the bucket (accepted MVP trade-off)
- `/api/vision` already accepts these URLs (its allowlist includes the project's Supabase hostname)

**Error 400:**
```json
{ "error": "content_type must be image/jpeg, image/png or image/webp" }
```

---

## Vision Matching

### POST /api/vision
Compares two pet photos using AWS Rekognition.
Called automatically when a new report is created, but can also be called manually.

**Request body:**
```json
{
  "source_report_id": "uuid",
  "target_report_id": "uuid"
}
```

**Response 200:**
```json
{
  "match": {
    "source_report_id": "uuid",
    "target_report_id": "uuid",
    "confidence": 89.3,
    "is_match": true
  }
}
```

**Notes:**
- `is_match` is `true` when `confidence >= 75`
- If `is_match` is true, both reports are automatically updated:
  - `matched_report_id` is set on both
  - `match_confidence` is set on both
- Rekognition compares the first photo from each report's `photo_urls` array

**Response 200 (no match):**
```json
{
  "match": {
    "source_report_id": "uuid",
    "target_report_id": "uuid",
    "confidence": 23.1,
    "is_match": false
  }
}
```

---

## Geo-alerts (internal — for testing)

### POST /api/lost-found/alert
Internal endpoint for querying nearby users around a report.
The `geo-alert` Edge Function handles this automatically on report creation; this endpoint is useful for manual testing.

**Request body:**
```json
{
  "report_id": "uuid",
  "radius_m": 2000
}
```

**Response 200:**
```json
{
  "alerted_users": [
    { "subscription_id": "uuid", "email": "test+near@gmail.com", "distance_m": 400 },
    { "subscription_id": "uuid", "email": "test+mid@gmail.com",  "distance_m": 1200 }
  ],
  "total": 2
}
```

**Notes:**
- Calls `get_users_near_report()` PostgreSQL function defined in schema.sql, which queries `alert_subscriptions`
- Unsubscribe tokens are stripped from this response — they must never leave the server except inside alert emails
- The `geo-alert` Edge Function handles emailing automatically — this endpoint only returns the subscriber list

---

## Alert Subscriptions

### POST /api/alert-subscriptions
Subscribes an email to lost/found alerts around a map point. No account needed.
One subscription per email — posting again with the same email updates the zone (upsert).

**Request body:**
```json
{
  "email": "ana@gmail.com",
  "full_name": "Ana García",
  "city": "CDMX",
  "location": { "lat": 19.4117, "lng": -99.1727 }
}
```

**Validation:**
- `email` required, valid format, max 255 chars — stored lowercased
- `location.lat` / `location.lng` required numbers, within [-90, 90] / [-180, 180]
- `full_name` optional, max 120 chars; `city` optional, max 120 chars

**Response 201:**
```json
{
  "subscription": { "id": "uuid", "email": "ana@gmail.com", "created_at": "..." },
  "message": "Subscribed. You'll get an email when a pet is reported near you."
}
```

### GET /api/alert-subscriptions/unsubscribe?token=<uuid>
Deletes the subscription matching the token. Linked from every alert email.

**Response 200:** `{ "message": "You will no longer receive alerts." }`
**Response 400:** missing or malformed token
**Response 404:** unknown token (already unsubscribed or never existed)
