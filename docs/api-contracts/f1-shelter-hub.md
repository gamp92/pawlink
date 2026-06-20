# F1 — Shelter Hub API Contracts

All endpoints require shelter authentication via Supabase Auth session.
Use `SUPABASE_SERVICE_ROLE_KEY` server-side for write operations.

---

## Animals

### GET /api/animals
Returns all animals for the authenticated shelter.

**Query params:**
```
shelter_id  uuid     required
status      string   optional — 'available' | 'in_process' | 'adopted'
species     string   optional — 'dog' | 'cat' | 'other'
```

**Response 200:**
```json
{
  "animals": [
    {
      "id": "uuid",
      "name": "Luna",
      "species": "dog",
      "breed": "Golden mix",
      "age_years": 2,
      "size": "medium",
      "gender": "female",
      "status": "available",
      "photo_urls": ["https://..."],
      "social_post": "Meet Luna 🐾...",
      "good_with_kids": true,
      "good_with_pets": false,
      "created_at": "2025-06-09T00:00:00Z"
    }
  ]
}
```

---

### POST /api/animals
Creates a new animal. Triggers N8N webhook to generate social post.

**Request body:**
```json
{
  "shelter_id": "uuid",
  "name": "Luna",
  "species": "dog",
  "breed": "Golden mix",
  "age_years": 2,
  "size": "medium",
  "gender": "female",
  "color": "golden",
  "description": "Energetic and loving...",
  "energy_level": "high",
  "good_with_kids": true,
  "good_with_pets": false,
  "vaccinated": true,
  "sterilized": true,
  "medical_notes": null,
  "photo_urls": ["https://..."]
}
```

**Response 201:**
```json
{
  "animal": {
    "id": "uuid",
    "name": "Luna",
    "social_post": null,
    "status": "available",
    "created_at": "2025-06-09T00:00:00Z"
  },
  "message": "Animal created. Social post will be generated shortly."
}
```

**Side effect:** Supabase Database Webhook triggers `social-post` Edge Function → Groq generates social post → saved to `animals.social_post`.

---

### PATCH /api/animals/:id
Updates an existing animal.

**Request body:** Any subset of animal fields.
```json
{
  "status": "in_process",
  "medical_notes": "Needs follow-up vaccination"
}
```

**Response 200:**
```json
{
  "animal": { "id": "uuid", "status": "in_process", "updated_at": "..." }
}
```

---

## Adoption Requests

### GET /api/adoption-requests
Returns all adoption requests for the authenticated shelter.

**Query params:**
```
shelter_id  uuid     required
status      string   optional — 'pending' | 'seen' | 'approved' | 'rejected'
```

**Response 200:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "status": "pending",
      "compatibility_score": 94.5,
      "compatibility_reasons": ["Calm temperament", "Good with kids"],
      "animal": {
        "id": "uuid",
        "name": "Luna",
        "photo_urls": ["https://..."]
      },
      "family": {
        "full_name": "Ana García",
        "email": "ana@email.com",
        "living_space": "apartment",
        "has_children": true,
        "has_other_pets": false
      },
      "created_at": "2025-06-09T00:00:00Z"
    }
  ]
}
```

---

### PATCH /api/adoption-requests/:id
Updates the status of an adoption request.

**Request body:**
```json
{
  "status": "approved",
  "notes": "Great match, interview scheduled for Monday"
}
```

**Response 200:**
```json
{
  "request": { "id": "uuid", "status": "approved", "updated_at": "..." }
}
```

**Side effect (approved only):** Supabase Database Webhook triggers `adoption-confirmation` Edge Function → sends confirmation email to family via Resend.

---

## Shelter Profile

### GET /api/shelters/:id
Returns public profile of a shelter. No auth required.

**Response 200:**
```json
{
  "shelter": {
    "id": "uuid",
    "name": "Refugio Patitas",
    "description": "...",
    "city": "CDMX",
    "cover_photo": "https://...",
    "instagram_url": "https://...",
    "stats": {
      "total_animals": 23,
      "available_animals": 18,
      "total_adoptions": 142
    }
  }
}
```
