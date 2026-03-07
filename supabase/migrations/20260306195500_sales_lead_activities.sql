-- Sales Lead Activities
create table public.sales_lead_activities (
    id uuid default gen_random_uuid() primary key,
    sales_lead_id uuid references public.sales_leads(id) on delete cascade not null,
    activity_date timestamp with time zone not null,
    activity_type text not null check (activity_type in ('Phone Call', 'Email', 'In Person', 'Other')),
    description text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sales_lead_activities enable row level security;

-- Sales Lead Activities: RLS Policies
create policy "Org isolation for sales_lead_activities" on public.sales_lead_activities
  for all using (sales_lead_id in (select id from public.sales_leads where org_id = get_user_org_id()));
