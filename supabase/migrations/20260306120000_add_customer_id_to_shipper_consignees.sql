-- Add customer_id to shipper_consignees
ALTER TABLE public.shipper_consignees
ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE;

-- Add dispatch_notes to customers
ALTER TABLE public.customers
ADD COLUMN dispatch_notes text;
