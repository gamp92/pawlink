"""
Create a development-only shelter dashboard test user.

Usage:
    python3 scripts/create_dashboard_test_user.py

Requires .env or .env.local with:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY

Creates/reuses:
    email: shelter.demo@pawlink.local
    password: Pawlink2025!
    shelter_id: 7a2f59a5-7d2f-477c-b11d-fe7c98d7aa30
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client
from supabase_auth.errors import AuthApiError


TEST_EMAIL = "shelter.demo@pawlink.local"
TEST_PASSWORD = "Pawlink2025!"
SHELTER_ID = "7a2f59a5-7d2f-477c-b11d-fe7c98d7aa30"
REQUIRED_SHELTER_USERS_COLUMNS = {"id", "shelter_id", "user_id", "role", "created_at"}


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


def print_postgrest_error(context: str, error: object) -> None:
    message = getattr(error, "message", None) or getattr(error, "details", None) or str(error)
    print(f"ERROR: {context}: {message}")


def execute_or_fail(query, context: str, allow_none: bool = False):
    try:
        result = query.execute()
    except Exception as error:
        print_postgrest_error(context, error)
        sys.exit(1)

    if result is None:
        if allow_none:
            return None
        fail(f"{context}: Supabase returned no response.")

    response_error = getattr(result, "error", None)
    if response_error:
        print_postgrest_error(context, response_error)
        sys.exit(1)

    return result


def verify_shelter_users_schema_contract() -> None:
    schema_path = Path(__file__).resolve().parents[1] / "docs" / "schema.sql"
    if not schema_path.exists():
        fail(f"Cannot verify shelter_users columns because {schema_path} does not exist.")

    schema = schema_path.read_text(encoding="utf-8")
    marker = "create table shelter_users ("
    start = schema.find(marker)
    if start == -1:
        fail("docs/schema.sql does not define create table shelter_users.")

    end = schema.find(");", start)
    if end == -1:
        fail("docs/schema.sql shelter_users definition is incomplete.")

    shelter_users_block = schema[start:end]
    missing_columns = sorted(
        column for column in REQUIRED_SHELTER_USERS_COLUMNS if column not in shelter_users_block
    )
    if missing_columns:
        fail(f"docs/schema.sql shelter_users is missing expected columns: {', '.join(missing_columns)}")

    print("OK: Verified shelter_users columns in docs/schema.sql.")


def find_auth_user_id(supabase, email: str) -> str | None:
    users = supabase.auth.admin.list_users(per_page=1000)
    for user in users:
        if user.email == email:
            return user.id
    return None


def get_or_create_auth_user(supabase) -> str:
    existing_user_id = find_auth_user_id(supabase, TEST_EMAIL)
    if existing_user_id:
        print(f"OK: Auth user already exists: {TEST_EMAIL}")
        return existing_user_id

    try:
        result = supabase.auth.admin.create_user(
            {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "email_confirm": True,
            }
        )
        print(f"OK: Created Auth user: {TEST_EMAIL}")
        return result.user.id
    except AuthApiError as error:
        reused_user_id = find_auth_user_id(supabase, TEST_EMAIL)
        if reused_user_id:
            print(f"OK: Auth user already exists after create retry: {TEST_EMAIL}")
            return reused_user_id
        print(f"ERROR: Could not create Auth user: {error}")
        sys.exit(1)


def verify_shelter_exists(supabase) -> None:
    result = execute_or_fail(
        supabase.table("shelters")
        .select("id, name")
        .eq("id", SHELTER_ID)
        .limit(1),
        "Checking shelter exists",
    )

    if not result.data or len(result.data) == 0:
        fail(f"Shelter not found for shelter_id={SHELTER_ID}")

    print(f"OK: Found shelter: {result.data[0]['name']} ({SHELTER_ID})")


def link_user_to_shelter(supabase, user_id: str) -> None:
    existing_link = execute_or_fail(
        supabase.table("shelter_users")
        .select("id, shelter_id, user_id, role")
        .eq("shelter_id", SHELTER_ID)
        .eq("user_id", user_id)
        .limit(1),
        "Checking existing shelter_users link",
    )

    existing_rows = existing_link.data or []
    if existing_rows:
        print(f"OK: shelter_users link already exists with role={existing_rows[0].get('role')}")
        return

    execute_or_fail(
        supabase.table("shelter_users").insert(
            {
                "shelter_id": SHELTER_ID,
                "user_id": user_id,
                "role": "admin",
            }
        ),
        "Creating shelter_users link",
    )
    print("OK: Linked Auth user to shelter_users as admin.")


def main() -> None:
    print("\nPawLink dashboard test user setup\n")
    supabase_url, service_role_key = load_environment()
    supabase = create_client(supabase_url, service_role_key)

    verify_shelter_users_schema_contract()
    verify_shelter_exists(supabase)
    user_id = get_or_create_auth_user(supabase)
    link_user_to_shelter(supabase, user_id)

    print("\nSuccess. Use this account to test /dashboard:")
    print(f"  email:    {TEST_EMAIL}")
    print(f"  password: {TEST_PASSWORD}")
    print(f"  shelter:  {SHELTER_ID}\n")


if __name__ == "__main__":
    main()
