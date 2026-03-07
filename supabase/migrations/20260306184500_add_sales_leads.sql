-- Create sales lead status enum
create type public.sales_lead_status as enum ('New', 'Contacted', 'Qualified', 'Lost', 'Converted');

-- Add sales_person_id to customers table
alter table public.customers
    add column sales_person_id uuid references public.profiles(id) on delete set null;

-- Sales Leads
create table public.sales_leads (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    company_name text not null,
    primary_contact text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    zip text,
    website text,
    status public.sales_lead_status default 'New'::public.sales_lead_status not null,
    notes text,
    assigned_to uuid references public.profiles(id) on delete set null,
    converted_to_customer_id uuid references public.customers(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sales_leads enable row level security;

-- Sales Leads: RLS Policies

-- Admins and Supervisors can do everything on their org's sales leads
create policy "Admins and Supervisors have full access to sales leads in org" on public.sales_leads
  for all using (
    org_id = get_user_org_id() 
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Admin', 'Supervisor')
    )
  );

-- Sales Reps can access and manage assigned sales leads
create policy "Sales Reps can access assigned sales leads" on public.sales_leads
  for all using (
    org_id = get_user_org_id()
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'Sales Rep'
    )
    and assigned_to = auth.uid()
  );
