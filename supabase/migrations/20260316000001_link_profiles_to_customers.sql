-- Add customer_id to profiles to support Customer Portal User Management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);
