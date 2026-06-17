# F4 — RAG Shelter Assistant API Contracts

> **STRETCH FEATURE** — Only implement if F1, F2, and F3 are complete and time allows.
> These endpoints depend on the F4 tables in schema.sql being uncommented and run first.

Public endpoints for querying. Upload endpoint requires shelter auth.

---

## Document Upload

### POST /api/rag/upload
Uploads a PDF document and triggers the ingestion pipeline.
Runs in a Supabase Edge Function (150s limit) — not a Vercel Function.

**Auth:** Required — shelter admin only.

**Request body:** `multipart/form-data`
```
shelter_id   uuid     required
file         File     required — PDF only, max 10MB
```

**Response 202:**
```json
{
  "document": {
    "id": "uuid",
    "file_name": "politicas_adopcion.pdf",
    "status": "processing",
    "created_at": "2025-06-09T00:00:00Z"
  },
  "message": "Document received. Processing may take up to 60 seconds."
}
```

**What happens after 202:**
1. PDF saved to Supabase Storage (`documents` bucket)
2. Edge Function runs: PyMuPDF extracts text → chunked at ~500 tokens → sentence-transformers generates embeddings → vectors saved to `document_chunks` table with `shelter_id`
3. `shelter_documents.status` updated to `ready` when complete

**Error 400:**
```json
{
  "error": "Only PDF files are accepted."
}
```

---

### GET /api/rag/documents
Returns all documents uploaded by the authenticated shelter.

**Auth:** Required — shelter admin only.

**Query params:**
```
shelter_id  uuid  required
```

**Response 200:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "file_name": "politicas_adopcion.pdf",
      "status": "ready",
      "chunk_count": 12,
      "created_at": "2025-06-09T00:00:00Z"
    },
    {
      "id": "uuid",
      "file_name": "requisitos.pdf",
      "status": "processing",
      "chunk_count": null,
      "created_at": "2025-06-09T00:00:00Z"
    }
  ]
}
```

---

## RAG Query

### POST /api/rag
Receives a question and returns a streaming answer grounded in the shelter's documents.
Uses LangChain LCEL: pgvector retrieval → Groq Llama 3 → cited response.

**Auth:** Not required — public endpoint.

**Request body:**
```json
{
  "shelter_id": "uuid",
  "question": "Can I adopt if I live in an apartment with two kids?"
}
```

**Response:** `text/event-stream` (streaming)

Each chunk is a Server-Sent Event:
```
data: {"token": "Yes"}
data: {"token": ", you"}
data: {"token": " can"}
...
data: {"token": "[DONE]", "citation": {"file_name": "politicas_adopcion.pdf", "section": 3}}
```

The final event includes the citation — which document and approximate section the answer came from.

**Notes:**
- Only answers from `document_chunks` where `shelter_id` matches — never crosses shelter boundaries
- If the answer is not found in the documents, streams: `"I could not find information about that in this shelter's documents."`
- Never uses Groq's general knowledge — only retrieved chunks
- Retrieves top 4 chunks by cosine similarity before generating

**Error 404:**
```json
{
  "error": "This shelter has no documents uploaded yet."
}
```
