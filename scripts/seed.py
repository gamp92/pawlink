"""
Pawlink seed script — Week 1 data setup
Generates: 5 shelters (CDMX), 50 animals, 7 geo-test alert subscriptions,
           10 lost/found reports

Usage:
    pip install supabase python-dotenv
    python scripts/seed.py

Requires .env with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
"""

import os
import random
import uuid
from datetime import datetime, timedelta

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)


# ── Shelters ────────────────────────────────────────────────────────────────

SHELTERS = [
    {
        "name": "Refugio Patitas Felices",
        "description": "Refugio dedicado al rescate y adopción de perros y gatos en la CDMX desde 2010.",
        "city": "Ciudad de México",
        "address": "Calle Moctezuma 45, Colonia Centro, CDMX",
        "lat": 19.4326, "lng": -99.1332,
        "phone": "+52 55 1234 5678",
        "email": "contacto@patitasfelices.mx",
        "instagram_url": "https://instagram.com/patitasfelices",
        "website_url": "https://patitasfelices.mx",
        "cover_photo": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
        "founded_year": 2010,
    },
    {
        "name": "Hogar Animal CDMX",
        "description": "Más de 200 animales rescatados al año. Adoptamos con seguimiento post-adopción.",
        "city": "Ciudad de México",
        "address": "Av. Insurgentes Sur 1234, Col. Del Valle",
        "lat": 19.3788, "lng": -99.1699,
        "phone": "+52 55 2345 6789",
        "email": "info@hogaranimal.mx",
        "instagram_url": "https://instagram.com/hogaranimalcdmx",
        "website_url": "https://hogaranimal.mx",
        "cover_photo": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800",
        "founded_year": 2015,
    },
    {
        "name": "Rescate Peludos MX",
        "description": "Especialistas en rescate de animales maltratados y callejeros en el norte de la CDMX.",
        "city": "Ciudad de México",
        "address": "Calzada de los Misterios 89, Col. Tepeyac",
        "lat": 19.4800, "lng": -99.1100,
        "phone": "+52 55 3456 7890",
        "email": "rescate@peludosmx.org",
        "instagram_url": "https://instagram.com/rescatepeludosmx",
        "website_url": None,
        "cover_photo": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800",
        "founded_year": 2018,
    },
    {
        "name": "Adopta un Amigo",
        "description": "Refugio familiar con capacidad para 80 animales. Cero eutanasia.",
        "city": "Ciudad de México",
        "address": "Periférico Sur 4567, Pedregal de San Ángel",
        "lat": 19.3200, "lng": -99.1900,
        "phone": "+52 55 4567 8901",
        "email": "hola@adoptaunamigo.mx",
        "instagram_url": "https://instagram.com/adoptaunamigomx",
        "website_url": "https://adoptaunamigo.mx",
        "cover_photo": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "founded_year": 2012,
    },
    {
        "name": "Fundación Huella",
        "description": "ONG enfocada en esterilización masiva y adopción responsable en Iztapalapa.",
        "city": "Ciudad de México",
        "address": "Av. Ermita Iztapalapa 3210, Iztapalapa",
        "lat": 19.3600, "lng": -99.0600,
        "phone": "+52 55 5678 9012",
        "email": "contacto@fundacionhuella.org",
        "instagram_url": "https://instagram.com/fundacionhuella",
        "website_url": "https://fundacionhuella.org",
        "cover_photo": "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=800",
        "founded_year": 2020,
    },
]

# ── Animals ─────────────────────────────────────────────────────────────────

DOG_NAMES = ["Max", "Luna", "Toby", "Bella", "Rocky", "Coco", "Bruno", "Lola",
             "Charlie", "Nala", "Zeus", "Maya", "Rex", "Mia", "Thor", "Lily",
             "Duke", "Daisy", "Bear", "Rosie"]
CAT_NAMES = ["Michi", "Gatito", "Salem", "Noche", "Canela", "Milo", "Sombra",
             "Pelusa", "Tigre", "Manchas", "Felix", "Misty", "Simba", "Luna",
             "Oreo", "Gris", "Pinto", "Nube", "Churro", "Caramelo"]

DOG_BREEDS = ["Labrador", "Pastor Alemán", "Golden Retriever", "Bulldog", "Beagle",
              "Mestizo", "Chihuahua", "Poodle", "Husky Siberiano", "Dálmata"]
CAT_BREEDS = ["Mestizo", "Siamés", "Persa", "Maine Coon", "Angora", "Bengalí",
              "Ragdoll", "British Shorthair", "Abisinio", "Esfinge"]

DOG_PHOTOS = [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600",
    "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600",
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600",
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600",
    "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
]
CAT_PHOTOS = [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600",
    "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600",
    "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600",
    "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600",
    "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600",
    "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600",
    "https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6?w=600",
]

COLORS = ["negro", "blanco", "café", "dorado", "gris", "atigrado", "manchado", "naranja"]
SIZES = ["small", "medium", "large"]
ENERGY_LEVELS = ["low", "medium", "high"]
STATUSES = ["available", "available", "available", "in_process", "adopted"]


def make_animal(shelter_id: str, index: int) -> dict:
    is_dog = index < 30
    species = "dog" if is_dog else "cat"
    names = DOG_NAMES if is_dog else CAT_NAMES
    breeds = DOG_BREEDS if is_dog else CAT_BREEDS
    photos = DOG_PHOTOS if is_dog else CAT_PHOTOS

    return {
        "shelter_id": shelter_id,
        "name": names[index % len(names)],
        "species": species,
        "breed": random.choice(breeds),
        "age_years": round(random.uniform(0.5, 10.0), 1),
        "size": random.choice(SIZES),
        "gender": random.choice(["male", "female"]),
        "color": random.choice(COLORS),
        "description": (
            f"{'Perro' if is_dog else 'Gato'} muy cariñoso en busca de un hogar. "
            "Lleva tiempo en el refugio y está listo para una familia que lo quiera."
        ),
        "energy_level": random.choice(ENERGY_LEVELS),
        "good_with_kids": random.choice([True, False]),
        "good_with_pets": random.choice([True, False]),
        "vaccinated": random.choice([True, False]),
        "sterilized": random.choice([True, False]),
        "status": random.choice(STATUSES),
        "photo_urls": [random.choice(photos)],
    }


# ── Geo-test users ───────────────────────────────────────────────────────────
# Reference point: Parque México, Condesa CDMX (19.4117, -99.1727)

GEO_TEST_USERS = [
    # CDMX — for geo-alert testing
    {
        "email": "test+near@gmail.com",
        "full_name": "Usuario Cerca",
        "city": "Ciudad de México",
        "lat": 19.4153, "lng": -99.1727,   # ~400m from reference
        "note": "should receive lost/found alerts",
    },
    {
        "email": "test+mid@gmail.com",
        "full_name": "Usuario Medio",
        "city": "Ciudad de México",
        "lat": 19.4226, "lng": -99.1580,   # ~1.2km from reference
        "note": "should receive lost/found alerts",
    },
    {
        "email": "test+far@gmail.com",
        "full_name": "Usuario Lejos",
        "city": "Ciudad de México",
        "lat": 19.3780, "lng": -99.1350,   # ~4km from reference
        "note": "should NOT receive lost/found alerts",
    },
    # Madrid, España
    {
        "email": "test+madrid1@gmail.com",
        "full_name": "Usuario Madrid 1",
        "city": "Madrid",
        "lat": 40.4168, "lng": -3.7038,    # Centro de Madrid
        "note": "Madrid user for EU coverage testing",
    },
    {
        "email": "test+madrid2@gmail.com",
        "full_name": "Usuario Madrid 2",
        "city": "Madrid",
        "lat": 40.4530, "lng": -3.6883,    # Barrio de Salamanca
        "note": "Madrid user for EU coverage testing",
    },
    # Ecuador
    {
        "email": "test+ecuador1@gmail.com",
        "full_name": "Usuario Ecuador 1",
        "city": "Quito",
        "lat": -0.1807, "lng": -78.4678,   # Centro histórico Quito
        "note": "Ecuador user for LATAM coverage testing",
    },
    {
        "email": "test+ecuador2@gmail.com",
        "full_name": "Usuario Ecuador 2",
        "city": "Guayaquil",
        "lat": -2.1894, "lng": -79.8891,   # Guayaquil
        "note": "Ecuador user for LATAM coverage testing",
    },
]

# ── Lost & Found reports ─────────────────────────────────────────────────────

LOST_FOUND_DATA = [
    {"type": "lost", "name": "Fido", "species": "dog", "breed": "Labrador",
     "color": "dorado", "lat": 19.4117, "lng": -99.1727,
     "notes": "Cerca de Parque México", "city": "Ciudad de México"},
    {"type": "found", "name": None, "species": "cat", "breed": "Mestizo",
     "color": "negro", "lat": 19.4270, "lng": -99.1676,
     "notes": "Encontrado en Polanco", "city": "Ciudad de México"},
    {"type": "lost", "name": "Luna", "species": "dog", "breed": "Beagle",
     "color": "manchado", "lat": 19.3900, "lng": -99.1800,
     "notes": "Última vez vista en Del Valle", "city": "Ciudad de México"},
    {"type": "found", "name": None, "species": "dog", "breed": "Mestizo",
     "color": "café", "lat": 19.4500, "lng": -99.1400,
     "notes": "Encontrado en Tlatelolco", "city": "Ciudad de México"},
    {"type": "lost", "name": "Michi", "species": "cat", "breed": "Siamés",
     "color": "blanco", "lat": 19.4326, "lng": -99.1332,
     "notes": "Se escapó del Centro Histórico", "city": "Ciudad de México"},
    {"type": "lost", "name": "Thor", "species": "dog", "breed": "Pastor Alemán",
     "color": "negro", "lat": 19.3600, "lng": -99.0600,
     "notes": "Perdido en Iztapalapa", "city": "Ciudad de México"},
    {"type": "found", "name": None, "species": "cat", "breed": "Mestizo",
     "color": "atigrado", "lat": 19.4800, "lng": -99.1100,
     "notes": "Encontrado en Tepeyac", "city": "Ciudad de México"},
    {"type": "lost", "name": "Bella", "species": "dog", "breed": "Poodle",
     "color": "blanco", "lat": 19.3200, "lng": -99.1900,
     "notes": "Perdida en Pedregal", "city": "Ciudad de México"},
    {"type": "found", "name": None, "species": "dog", "breed": "Chihuahua",
     "color": "café", "lat": 19.3788, "lng": -99.1699,
     "notes": "Encontrado en Insurgentes Sur", "city": "Ciudad de México"},
    {"type": "lost", "name": "Simba", "species": "cat", "breed": "Persa",
     "color": "naranja", "lat": 19.4153, "lng": -99.1580,
     "notes": "Se perdió en la Condesa", "city": "Ciudad de México"},
]


# ── Seed functions ───────────────────────────────────────────────────────────

def seed_shelters() -> list[str]:
    print("Seeding shelters...")
    shelter_ids = []
    for s in SHELTERS:
        lat, lng = s.pop("lat"), s.pop("lng")
        s["location"] = f"POINT({lng} {lat})"
        result = supabase.table("shelters").insert(s).execute()
        shelter_ids.append(result.data[0]["id"])
        print(f"  ✓ {s['name']}")
    return shelter_ids


def seed_animals(shelter_ids: list[str]) -> None:
    print("Seeding animals (50)...")
    animals = []
    for i in range(50):
        shelter_id = shelter_ids[i % len(shelter_ids)]
        animals.append(make_animal(shelter_id, i))

    # Insert in batches of 10
    for i in range(0, len(animals), 10):
        supabase.table("animals").insert(animals[i:i+10]).execute()
    print(f"  ✓ 50 animals inserted")


def seed_alert_subscriptions() -> None:
    print("Seeding geo-test alert subscriptions...")
    for u in GEO_TEST_USERS:
        supabase.table("alert_subscriptions").upsert({
            "email": u["email"],
            "full_name": u["full_name"],
            "city": u["city"],
            "location": f"POINT({u['lng']} {u['lat']})",
        }, on_conflict="email").execute()
        print(f"  ✓ {u['email']} ({u['city']}) — {u['note']}")


def seed_lost_found() -> None:
    print("Seeding lost & found reports (10)...")
    for r in LOST_FOUND_DATA:
        lat, lng = r.pop("lat"), r.pop("lng")
        notes = r.pop("notes")
        photos = DOG_PHOTOS if r["species"] == "dog" else CAT_PHOTOS
        supabase.table("lost_found_reports").insert({
            "report_type": r["type"],
            "pet_name": r["name"],
            "species": r["species"],
            "breed": r["breed"],
            "color": r["color"],
            "description": f"{r['species'].capitalize()} {'perdido' if r['type'] == 'lost' else 'encontrado'}. {notes}.",
            "location": f"POINT({lng} {lat})",
            "location_notes": notes,
            "city": r["city"],
            # Real photo so the map UI has images and /api/vision is demoable
            "photo_urls": [random.choice(photos)],
        }).execute()
    print(f"  ✓ 10 lost/found reports inserted")


def main():
    print("\n🐾 Pawlink seed script starting...\n")
    shelter_ids = seed_shelters()
    seed_animals(shelter_ids)
    seed_alert_subscriptions()
    seed_lost_found()
    print("\n✅ Seed complete!")
    print(f"\nGeo-test alert subscriptions (no accounts — email + map point only):")
    for u in GEO_TEST_USERS:
        print(f"  {u['city']:<16} → {u['email']} — {u['note']}")


if __name__ == "__main__":
    main()
