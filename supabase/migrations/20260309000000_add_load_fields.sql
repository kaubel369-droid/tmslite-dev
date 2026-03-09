-- Add BOL number and Product Lines
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS bol_number TEXT;

-- Create load_products table
CREATE TABLE IF NOT EXISTS public.load_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    pallets INTEGER,
    weight NUMERIC(10,2),
    description TEXT,
    nmfc_class TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.load_products ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for load_products
CREATE POLICY "Org isolation for load_products" ON public.load_products
    FOR ALL USING (load_id IN (SELECT id FROM public.loads WHERE org_id = get_user_org_id()));
