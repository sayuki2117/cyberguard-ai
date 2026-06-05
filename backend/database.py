# ===============================================================
# FILE: database.py
# PURPOSE: Supabase database connection.
#          Two clients:
#          - admin_client: uses service role key (bypasses RLS)
#            Use ONLY in backend for privileged operations
#          - anon_client:  uses anon key (respects RLS)
#            Use for user-context operations
# ===============================================================

from supabase import Client, create_client

from config import settings


# Admin client: full database access, bypasses Row Level Security.
# NEVER expose this key to the frontend.
admin_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key,
)

# Anon client: respects RLS, safe for user-context queries.
anon_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key,
)


def get_admin_db() -> Client:
    """Get admin Supabase client. Use only for server-side privileged ops."""
    return admin_client


def get_user_db(user_jwt: str) -> Client:
    """
    Get a Supabase client authenticated as the current user.
    This respects Row Level Security, so users can only see allowed data.
    """
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.auth.set_session(user_jwt, "")
    return client
