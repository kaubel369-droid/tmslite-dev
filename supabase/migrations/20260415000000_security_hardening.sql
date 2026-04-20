-- Security Hardening Migration
-- Addresses Supabase Advisor security recommendations

-- 1. Harden Public Schema Permissions
-- Revoke all permissions on public schema to prevent unauthorized access
REVOKE ALL ON SCHEMA public FROM public;
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM authenticated;

-- Grant only USAGE to allow standard Supabase access
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Harden SECURITY DEFINER Functions
-- Adding SET search_path = public to prevent search path hijacking

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  select org_id from public.profiles where id = auth.uid() limit 1;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_api_key(raw_key text, secret_key text) 
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  select pgp_sym_encrypt(raw_key, secret_key)::text;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, secret_key text) 
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  select pgp_sym_decrypt(encrypted_key::bytea, secret_key);
$$;

CREATE OR REPLACE FUNCTION public.get_public_tracking_info(p_load_number text)
RETURNS TABLE(load_number text, status public.load_status, origin_zip text, destination_zip text, last_updated timestamp with time zone) 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.load_number, 
    l.status, 
    l.origin_zip, 
    l.destination_zip, 
    l.updated_at as last_updated
  FROM public.loads l
  WHERE l.load_number = p_load_number;
$$;

-- 3. Fix RLS Policies

-- Add SELECT policy for zip_codes (satisfies "Table has RLS but no policies" warning)
CREATE POLICY "Anyone can view zip codes" ON public.zip_codes
FOR SELECT TO authenticated, anon
USING (true);

-- Standardize Carrier Policies (Switching from auth.jwt() to get_user_org_id() for consistency)
DROP POLICY IF EXISTS "Users can view carriers in their organization" ON public.carriers;
DROP POLICY IF EXISTS "Users can insert carriers in their organization" ON public.carriers;
DROP POLICY IF EXISTS "Users can update carriers in their organization" ON public.carriers;
DROP POLICY IF EXISTS "Users can delete carriers in their organization" ON public.carriers;

CREATE POLICY "Users can view carriers in their organization" ON public.carriers
FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert carriers in their organization" ON public.carriers
FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update carriers in their organization" ON public.carriers
FOR UPDATE USING (org_id = get_user_org_id()) WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can delete carriers in their organization" ON public.carriers
FOR DELETE USING (org_id = get_user_org_id());

-- Standardize Carrier Document Policies
DROP POLICY IF EXISTS "Users can view carrier documents in their organization" ON public.carrier_documents;
DROP POLICY IF EXISTS "Users can insert carrier documents in their organization" ON public.carrier_documents;
DROP POLICY IF EXISTS "Users can update carrier documents in their organization" ON public.carrier_documents;
DROP POLICY IF EXISTS "Only Supervisor or Admin can delete carrier documents" ON public.carrier_documents;

CREATE POLICY "Users can view carrier documents in their organization" ON public.carrier_documents
FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert carrier documents in their organization" ON public.carrier_documents
FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update carrier documents in their organization" ON public.carrier_documents
FOR UPDATE USING (org_id = get_user_org_id()) WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Only Supervisor or Admin can delete carrier documents" ON public.carrier_documents
FOR DELETE USING (org_id = get_user_org_id() AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('Admin', 'Supervisor'))));

-- Standardize Carrier Insurance Policies
DROP POLICY IF EXISTS "Users can manage their organization's carrier insurance" ON public.carrier_insurance;

CREATE POLICY "Users can manage their organization's carrier insurance" ON public.carrier_insurance
FOR ALL USING (org_id = get_user_org_id()) WITH CHECK (org_id = get_user_org_id());
