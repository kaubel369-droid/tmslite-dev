-- 20261020162551_comply_oct30_public_grants_and_default_privileges.sql
-- Complies with Supabase's October 30, 2026 breaking change:
-- "New tables in public need grants from October 30"

-- 1. Explicitly grant privileges on all existing tables, views, and sequences in public
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Explicitly grant EXECUTE on existing functions in public
GRANT EXECUTE ON FUNCTION public.get_public_tracking_info(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_sync_profile_email() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated, service_role;

-- 2. Revoke automatic default privileges in public schema (Supabase October 30, 2026 requirement)
-- Future tables, sequences, and functions in public will require explicit GRANTs to be exposed to the Data API.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
