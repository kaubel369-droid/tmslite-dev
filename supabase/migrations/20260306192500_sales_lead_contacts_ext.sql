-- Add missing 'ext' column to contacts tables
ALTER TABLE public.sales_lead_contacts ADD COLUMN IF NOT EXISTS ext text;
ALTER TABLE public.customer_contacts ADD COLUMN IF NOT EXISTS ext text;
