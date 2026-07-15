# F2 — Smart Adoption API Contracts

Public endpoints — no auth required unless submitting an adoption request.

---

## Animal Gallery

### GET /api/animals/public
Returns all available animals across all shelters. Used for the general gallery.

**Query params:**
```
species       string   optional — 'dog' | 'cat' | 'other'
size          string   optional — 'small' | 'medium' | 'large'
energy_level  string   optional — 'low' | 'medium' | 'high'
good_with_kids   boolean  optional
good_with_pets   boolean  optional
shelter_id    uuid     optional — filter by specific shelter
limit         int      optional — default 20
offset        int      optional — default 0
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
      "energy_level": "high",
      "good_with_kids": true,
      "good_with_pets": false,
      "photo_urls": ["https://..."],
      "shelter": {
        "id": "uuid",
        "name": "Refugio Patitas",
        "city": "CDMX"
      }
    }
  ],
  "total": 47,
  "limit": 20,
  "offset": 0
}
```

---

## Compatibility Matching

### POST /api/matching
Receives a family profile and returns animals ranked by compatibility score.
Calls Groq API with family profile + animal list → returns scores and reasons.

**Request body:**
```json
{
  "shelter_id": "uuid",
  "family_profile": {
    "living_space": "apartment",
    "lifestyle": "moderate",
    "experience": "some",
    "has_other_pets": false,
    "has_children": true
  },
  "filters": {
    "species": "dog",
    "size": "small"
  }
}
```

**living_space values:** `apartment` | `house_no_yard` | `house_yard`
**lifestyle values:** `sedentary` | `moderate` | `active`
**experience values:** `none` | `some` | `experienced`

**Response 200:**
```json
{
  "results": [
    {
      "animal": {
        "id": "uuid",
        "name": "Luna",
        "species": "dog",
        "breed": "Golden mix",
        "age_years": 2,
        "photo_urls": ["https://..."],
        "shelter": {
          "id": "uuid",
          "name": "Refugio Patitas"
        }
      },
      "compatibility_score": 94.5,
      "compatibility_reasons": [
        "Calm temperament suitable for apartment living",
        "Known to be great with children",
        "Low exercise needs match your lifestyle"
      ]
    },
    {
      "animal": { "id": "uuid", "name": "Bruno", "..." : "..." },
      "compatibility_score": 61.0,
      "compatibility_reasons": ["..."]
    }
  ]
}
```

**Notes:**
- Results are sorted by `compatibility_score` descending
- Groq is called once with all animals in context — not one call per animal
- If no `shelter_id` is provided, matches across all shelters

---

## Adoption Requests

### POST /api/adoption-requests
Submits an adoption request. No account needed — contact info travels inline with the request.

**Auth:** None. Public endpoint.

**Request body:**
```json
{
  "animal_id": "uuid",
  "shelter_id": "uuid",
  "full_name": "Ana García",
  "email": "ana@gmail.com",
  "phone": "+52 55 1234 5678",
  "family_profile": {
    "living_space": "apartment",
    "lifestyle": "moderate",
    "experience": "some",
    "has_other_pets": false,
    "has_children": true
  },
  "compatibility_score": 94.5,
  "compatibility_reasons": [
    "Calm temperament suitable for apartment living",
    "Known to be great with children"
  ]
}
```

**Validation:**
- `full_name` required, non-empty, max 120 chars
- `email` required, valid format, max 255 chars — dedupe key together with `animal_id`
- `phone` optional, max 20 chars
- `family_profile`, `compatibility_score`, `compatibility_reasons` optional (questionnaire snapshot)

**Response 201:**
```json
{
  "request": {
    "id": "uuid",
    "status": "pending",
    "animal_id": "uuid",
    "shelter_id": "uuid",
    "created_at": "2025-06-09T00:00:00Z"
  },
  "message": "Request submitted. The shelter will contact you soon."
}
```

**Side effect:** None — the shelter sees the new request in their F1 dashboard (`GET /api/adoption-requests`). Email notification to the shelter was originally planned via N8N but was not implemented.

**Error 409** — same email already has a pending request for this animal:
```json
{
  "error": "You already have a pending request for this animal."
}
```
