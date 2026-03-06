-- Shipper / Consignees
create type public.shipper_consignee_status as enum ('Active', 'Credit Hold', 'Inactive');

create table public.shipper_consignees (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    address text,
    city text,
    state text,
    zip text,
    phone text,
    email text,
    website text,
    status public.shipper_consignee_status default 'Active'::public.shipper_consignee_status not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.shipper_consignees enable row level security;

-- Shipper / Consignee Contacts
create table public.shipper_consignee_contacts (
    id uuid default gen_random_uuid() primary key,
    shipper_consignee_id uuid references public.shipper_consignees(id) on delete cascade not null,
    name text not null,
    phone text,
    cell_phone text,
    email text,
    position text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.shipper_consignee_contacts enable row level security;

-- RLS
create policy "Org isolation for shipper_consignees" on public.shipper_consignees
  for all using (org_id = get_user_org_id());

create policy "Org isolation for shipper_consignee_contacts" on public.shipper_consignee_contacts
  for all using (shipper_consignee_id in (select id from public.shipper_consignees where org_id = get_user_org_id()));
