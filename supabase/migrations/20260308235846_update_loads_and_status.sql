-- Rename 'Quoting' to 'Not Dispatched'
ALTER TYPE public.load_status RENAME VALUE 'Quoting' TO 'Not Dispatched';

-- Add new status 'Cancelled'
ALTER TYPE public.load_status ADD VALUE 'Cancelled';

-- Add shipper_id and consignee_id to loads table
ALTER TABLE public.loads 
ADD COLUMN shipper_id uuid references public.shipper_consignees(id) on delete restrict,
ADD COLUMN consignee_id uuid references public.shipper_consignees(id) on delete restrict;
