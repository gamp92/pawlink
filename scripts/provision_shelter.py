"""
Provision a new shelter end-to-end:
  1. Insert the shelter into `shelters`
  2. Create (or reuse) its admin login in Supabase Auth
  3. Link them in `shelter_users` with role 'admin'

Usage:
    # PowerShell
    $env:SHELTER_ADMIN_PASSWORD = "the-password"
    python scripts/provision_shelter.py --name "Refugio X" --email admin@refugiox.mx

    # bash
    SHELTER_ADMIN_PASSWORD="the-password" python scripts/provision_shelter.py \
        --name "Refugio X" --email admin@refugiox.mx

Optional flags: --city --address --phone --description --shelter-email

The password comes ONLY from the SHELTER_ADMIN_PASSWORD environment variable so
it never lands in the repo, the shell history, or a process listing. Requires
.env (or .env.local) with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

Safety: if the login email is already linked to any shelter, the script aborts
instead of silently linking it to a second one.
"""

import argparse
import os
import re
import sys

from dotenv import load_dotenv
from supabase import create_client
from supabase_auth.errors import AuthApiError

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MIN_PASSWORD_LENGTH = 8


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


def load_environment() -> tuple[str, str]:
    load_dotenv(".env.local")
    load_dotenv()
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url:
        fail("NEXT_PUBLIC_SUPABASE_URL is not set.")
    if not service_role_key:
        fail("SUPABASE_SERVICE_ROLE_KEY is not set.")
    return supabase_url, service_role_key


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Provision a shelter + its admin login.")
    parser.add_argument("--name", required=True, help="Shelter display name")
    parser.add_argument("--email", required=True, help="Admin login email (Supabase Auth)")
    parser.add_argument("--city", default=None)
    parser.add_argument("--address", default=None)
    parser.add_argument("--phone", default=None)
    parser.add_argument("--description", default=None)
    parser.add_argument("--shelter-email", default=None, help="Public contact email for the shelter profile")
    return parser.parse_args()


def read_password() -> str:
    password = os.environ.get("SHELTER_ADMIN_PASSWORD")
    if not password:
        fail("SHELTER_ADMIN_PASSWORD is not set. Set it as an environment variable (never as a CLI argument).")
    if len(password) < MIN_PASSWORD_LENGTH:
        fail(f"SHELTER_ADMIN_PASSWORD must be at least {MIN_PASSWORD_LENGTH} characters.")
    return password


def validate_email(email: str) -> None:
    if not EMAIL_PATTERN.match(email):
        fail(f"'{email}' is not a valid email address.")


def find_auth_user_id(supabase, email: str) -> str | None:
    users = supabase.auth.admin.list_users(per_page=1000)
    return next((user.id for user in users if user.email == email), None)


def get_or_create_auth_user(supabase, email: str, password: str) -> str:
    existing_user_id = find_auth_user_id(supabase, email)
    if existing_user_id:
        print(f"OK: Auth user already exists, reusing it: {email}")
        return existing_user_id

    try:
        result = supabase.auth.admin.create_user(
            {"email": email, "password": password, "email_confirm": True}
        )
    except AuthApiError as error:
        fail(f"Could not create the auth user: {error.message}")
    print(f"OK: Created auth user {email}")
    return result.user.id


def abort_if_already_linked(supabase, user_id: str) -> None:
    result = supabase.table("shelter_users").select("shelter_id").eq("user_id", user_id).execute()
    links = result.data or []
    if not links:
        return
    fail(
        f"This login is already linked to shelter {links[0]['shelter_id']}. "
        "Use a different --email, or remove the existing shelter_users row first."
    )


def create_shelter(supabase, args: argparse.Namespace) -> str:
    shelter = {
        "name": args.name,
        "city": args.city,
        "address": args.address,
        "phone": args.phone,
        "description": args.description,
        "email": args.shelter_email,
    }
    payload = {key: value for key, value in shelter.items() if value is not None}
    result = supabase.table("shelters").insert(payload).execute()
    if not result.data:
        fail("Shelter insert returned no row.")
    shelter_id = result.data[0]["id"]
    print(f"OK: Created shelter '{args.name}' ({shelter_id})")
    return shelter_id


def link_user_to_shelter(supabase, shelter_id: str, user_id: str) -> None:
    supabase.table("shelter_users").insert(
        {"shelter_id": shelter_id, "user_id": user_id, "role": "admin"}
    ).execute()
    print("OK: Linked login to shelter with role 'admin'")


def main() -> None:
    args = parse_args()
    validate_email(args.email)
    password = read_password()

    supabase_url, service_role_key = load_environment()
    supabase = create_client(supabase_url, service_role_key)

    user_id = get_or_create_auth_user(supabase, args.email, password)
    abort_if_already_linked(supabase, user_id)
    shelter_id = create_shelter(supabase, args)
    link_user_to_shelter(supabase, shelter_id, user_id)

    print("\nProvisioning complete.")
    print(f"  Shelter:  {args.name}  ({shelter_id})")
    print(f"  Login:    {args.email}  (password: the one you set in SHELTER_ADMIN_PASSWORD)")
    print("  Next:     log in at /login and open /dashboard")


if __name__ == "__main__":
    main()
