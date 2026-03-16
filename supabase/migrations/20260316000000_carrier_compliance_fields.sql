-- Add carrier compliance fields
ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS safety_rating TEXT,
ADD COLUMN IF NOT EXISTS last_safety_check TIMESTAMPTZ;
