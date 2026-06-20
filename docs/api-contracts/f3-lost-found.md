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
1. Supabase Database Webhook triggers `geo-alert` Edge Function → calls `get_users_near_report()` PostGIS function → sends email alerts to users within 2km via Resend
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
    { "user_id": "uuid", "email": "test+near@gmail.com", "distance_m": 400 },
    { "user_id": "uuid", "email": "test+mid@gmail.com",  "distance_m": 1200 }
  ],
  "total": 2
}
```

**Notes:**
- Calls `get_users_near_report()` PostgreSQL function defined in schema.sql
- The reporter is excluded from the alert list automatically
- The `geo-alert` Edge Function handles emailing automatically — this endpoint only returns the user list
