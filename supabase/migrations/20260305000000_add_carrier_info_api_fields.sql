-- Add new carrier info and API fields to the carriers table
ALTER TABLE public.carriers
ADD COLUMN website TEXT,
ADD COLUMN dot_number TEXT,
ADD COLUMN ein TEXT,
ADD COLUMN mc_number TEXT,
ADD COLUMN scac TEXT,
ADD COLUMN insurance_status TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN api_key TEXT,
ADD COLUMN api_secret TEXT,
ADD COLUMN api_url TEXT,
ADD COLUMN api_account_number TEXT,
ADD COLUMN api_username TEXT,
ADD COLUMN api_password TEXT,
ADD COLUMN api_enabled BOOLEAN DEFAULT false;
