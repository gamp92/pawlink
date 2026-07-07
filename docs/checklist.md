# Pawlink — Checklist de Backend

Actualizado: 2026-07-03

---

## Infraestructura

- [x] Repo GitHub creado — https://github.com/gamp92/pawlink
- [x] Supabase proyecto creado — `pawlink` (ref: etxjyvjrinsvrnzqwmpf, us-east-1)
- [x] Vercel conectado — https://pawlink-theta.vercel.app (auto-deploy en push a main)
- [x] PostGIS habilitado en Supabase
- [x] pgvector habilitado en Supabase (para F4 RAG)
- [x] Schema SQL listo — `docs/schema.sql`
- [x] Schema SQL ejecutado en Supabase — verificado 2026-07-02: migración `initial_schema`, 6 tablas, RLS habilitado, triggers y `get_users_near_report` presentes
- [x] Storage buckets creados — `pets` (público) y `documents` (privado)

> Nota: el proyecto Supabase (free tier) se pausa por inactividad. Se restauró el 2026-07-02. Si las queries fallan con timeout, revisar status en el dashboard y restaurar.

---

## Variables de entorno (Vercel)

- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `GROQ_API_KEY`
- [ ] `AWS_ACCESS_KEY_ID` — falta crear cuenta AWS
- [ ] `AWS_SECRET_ACCESS_KEY` — falta crear cuenta AWS
- [ ] `AWS_REGION` — falta crear cuenta AWS
- [x] `RESEND_API_KEY`

---

## F1 — Shelter Hub

- [x] `GET /api/animals` — lista animales del shelter autenticado
- [x] `POST /api/animals` — crea animal + dispara social-post Edge Function
- [x] `PATCH /api/animals/[id]` — actualiza animal
- [x] `DELETE /api/animals/[id]` — elimina animal
- [x] `GET /api/adoption-requests` — lista solicitudes del shelter
- [x] `POST /api/adoption-requests` — crea solicitud de adopción
- [x] `PATCH /api/adoption-requests/[id]` — cambia status (aprueba/rechaza)
- [x] `GET /api/shelters/[id]` — perfil público del shelter con stats
- [ ] `POST /api/upload` — subir foto a Supabase Storage bucket `pets` — ⚠️ bloqueado: no existe contrato en `docs/api-contracts/` (regla: contrato primero). Nota: el contrato F3 asume que el frontend sube fotos directo a Storage; definir con Jose si va endpoint o subida directa
- [x] Middleware de auth — `/dashboard/*` protegido con sesión de Supabase (2026-07-03). Sin sesión → redirect a `/login?redirect=<ruta>`. ⚠️ Falta que el frontend cree la página `/login`
- [x] RLS policies — verificadas via `pg_policies` 2026-07-02 (12 policies en 5 tablas, coinciden con schema.sql)
- [ ] Testing con datos reales del seed

---

## F2 — Smart Adoption

- [x] `GET /api/animals/public` — galería pública con filtros
- [x] `POST /api/matching` — matching con Groq (lógica real implementada)
  - [x] Bug corregido 2026-07-03: la respuesta de Groq se truncaba (`finish_reason: length`) y el JSON quedaba inválido → 502. Fix: prompt compacto, 2 razones cortas, `max_tokens: 3000` y JSON mode. Verificado local: 200 con resultados rankeados
  - ⚠️ Límite del free tier de Groq: 6,000 tokens/min ≈ **1 llamada de matching por minuto**. Para el demo alcanza; si se necesita más, upgrade a Dev Tier en console.groq.com/settings/billing
- [ ] Testing con datos reales del seed

---

## F3 — Lost & Found

- [x] `GET /api/lost-found` — reportes con filtro PostGIS opcional
- [x] `POST /api/lost-found` — crea reporte + dispara geo-alert Edge Function
- [x] `PATCH /api/lost-found/[id]` — cierra reporte
- [x] `POST /api/lost-found/alert` — debug endpoint (testing PostGIS, no envía emails)
- [x] `POST /api/vision` — comparación de fotos con AWS Rekognition (código listo)
- [ ] Crear cuenta AWS + configurar credenciales para que /api/vision funcione
- [ ] Testing con datos reales del seed

---

## Edge Functions (Supabase)

- [x] `social-post` — genera post en español con Groq al crear animal
  - [ ] ⚠️ Groq decomisionó `llama3-8b-8192` → código actualizado a `llama-3.1-8b-instant` (también en `/api/matching`). **Falta re-deploy**: `supabase functions deploy social-post`
- [x] `geo-alert` — busca usuarios cercanos con PostGIS + envía emails via Resend
  - [x] Bug corregido 2026-07-02: `get_users_near_report` no devolvía nadie con `reporter_id` NULL (`!=` vs `is distinct from`) + faltaba `grant select on auth.users to service_role` para llamadas via PostgREST. Ambos aplicados como migraciones y reflejados en `docs/schema.sql`
- [x] `adoption-confirmation` — envía email de confirmación al aprobar adopción
- [x] Database Webhooks configurados — verificado 2026-07-02: `on_animal_insert` → social-post, `on_lost_found_insert` → geo-alert, `on_adoption_approved` → adoption-confirmation (las 3 functions ACTIVE, v3)
- [x] Secrets verificados en Supabase: `GROQ_API_KEY`, `RESEND_API_KEY` (configurados 2026-06-20)
- [ ] (stretch) `shelter-notification` — Edge Function + webhook en INSERT de `adoption_requests` → email al shelter avisando que llegó una solicitud nueva. La Feature Guide lo describe pero nunca se implementó (hoy el shelter solo se entera al abrir su dashboard). Mismo patrón que las otras 3 functions

---

## F4 — RAG Shelter Assistant (stretch goal)

- [x] Tablas en schema SQL (comentadas, listas para activar)
- [ ] `POST /api/rag/upload` — subir PDF + ingestión con embeddings
- [ ] `GET /api/rag/documents` — listar docs del shelter
- [ ] `POST /api/rag` — respuesta streaming con LangChain + pgvector + Groq
- [ ] Solo implementar si F1-F3 están completos y hay tiempo antes del Demo Day

---

## Seed y testing

- [x] `scripts/seed.py` — genera datos falsos (5 shelters CDMX, 50 animales, 20 familias, 10 reportes)
- [x] Ejecutar seed contra Supabase real — 2026-07-02: 5 shelters, 50 animales, 20 familias, 10 reportes. Seed ahora es re-ejecutable (reusa auth users existentes)
- [x] Verificar usuarios geo-test — verificado con `get_users_near_report` sobre el reporte de Fido (Parque México): test+near 399m ✓, test+mid 1959m ✓, test+far ~4km excluido ✓ (nota: familia.garcia@gmail.com queda a 1776m, también recibe alertas de esa zona)

---

## Documentación

- [x] `docs/schema.sql`
- [x] `docs/api-contracts/f1-shelter-hub.md`
- [x] `docs/api-contracts/f2-smart-adoption.md`
- [x] `docs/api-contracts/f3-lost-found.md`
- [x] `docs/api-contracts/f4-rag-assistant.md`
- [x] `docs/guia-vercel-supabase.md`
- [x] `CLAUDE.md`
- [x] `README.md`

---

## Seguridad / Git

- [x] Repo hecho público (Vercel Hobby no soporta colaboración en repos privados)
- [x] Ruleset en GitHub — solo colaboradores en bypass list pueden mergear/pushear a `main`
- [x] Verificado: no hay API keys ni secrets hardcodeados en el código