-- 1. Add new role to the enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Sales Rep/Customer Service Rep';
COMMIT;

-- 2. Update existing Sales Leads RLS policies to include the new role
DROP POLICY IF EXISTS "Sales Reps can access assigned sales leads" ON public.sales_leads;
CREATE POLICY "Sales Reps can access assigned sales leads" ON public.sales_leads
  FOR ALL USING (
    org_id = get_user_org_id()
    AND exists (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role in ('Sales Rep', 'Sales Rep/Customer Service Rep')
    )
    AND assigned_to = auth.uid()
  );

-- 3. Create Sales Lead Contacts table
CREATE TABLE public.sales_lead_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sales_lead_id uuid REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    phone text,
    cell_phone text,
    email text,
    position text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sales_lead_contacts ENABLE ROW LEVEL SECURITY;

-- 4. RLS for sales_lead_contacts
-- We align it exactly with how sales_leads handles org_id access, using the linked sales_lead_id's org.
CREATE POLICY "Org isolation for sales_lead_contacts" ON public.sales_lead_contacts
  FOR ALL USING (
    sales_lead_id IN (
      SELECT id FROM public.sales_leads WHERE org_id = get_user_org_id()
    )
  );
