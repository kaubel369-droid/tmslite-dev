-- Supabase Database Migration Plan

-- 1. Enable Dependencies
create extension if not exists "pgcrypto";

-- 2. Base Security
-- Avoid accidental deletion of tables
-- Enable RLS natively

-- 3. Core Tables

-- Organizations table
create table public.organizations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    mc_number text,
    dot_number text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.organizations enable row level security;

-- Profiles linking to auth.users
create type public.user_role as enum ('Admin', 'Supervisor', 'Customer Service Rep', 'Sales Rep', 'Customer');

create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    org_id uuid references public.organizations(id) on delete set null,
    first_name text,
    last_name text,
    role user_role default 'Customer'::user_role not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

-- Permissions and Roles Mapping
create table public.permissions (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.permissions enable row level security;

create table public.role_permissions (
    id uuid default gen_random_uuid() primary key,
    role public.user_role not null,
    permission_id uuid references public.permissions(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(role, permission_id)
);
alter table public.role_permissions enable row level security;

-- Global/Org Settings
create table public.settings (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    setting_key text not null,
    setting_value jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(org_id, setting_key)
);
alter table public.settings enable row level security;

-- Customers (CRM)
create type public.customer_status as enum ('Active', 'Credit Hold', 'Inactive');

create table public.customers (
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
    status public.customer_status default 'Active'::public.customer_status not null,
    notes text,
    credit_limit numeric(10,2) default 0.00,
    payment_terms text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customers enable row level security;

-- Customer Contacts
create table public.customer_contacts (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null,
    name text not null,
    phone text,
    cell_phone text,
    email text,
    position text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customer_contacts enable row level security;

-- Customer Documents Metadata
create table public.customer_documents (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null,
    file_name text not null,
    file_path text not null,
    uploaded_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customer_documents enable row level security;

-- Carrier Accounts (Encrypted Credentials)
create table public.carrier_accounts (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    carrier_name text not null, -- e.g., 'ODFL', 'XPO', 'ESTES'
    scac_code text not null,
    api_client_id text,
    api_client_secret text,
    api_key text, -- Encrypted at rest
    account_number text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.carrier_accounts enable row level security;

-- Loads (TMS Workflow)
create type public.load_status as enum ('Quoting', 'Dispatched', 'In-Transit', 'Delivered', 'Invoiced');

create table public.loads (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    customer_id uuid references public.customers(id) on delete restrict,
    load_number text not null unique,
    status load_status default 'Quoting'::load_status not null,
    origin_zip text not null,
    destination_zip text not null,
    total_weight numeric(10,2) not null,
    nmfc_class text,
    total_pallets integer,
    customer_rate numeric(10,2),
    carrier_rate numeric(10,2),
    fuel_surcharge numeric(10,2),
    carrier_quote_id text,
    carrier_pro_number text,
    selected_carrier_id uuid references public.carrier_accounts(id) on delete restrict,
    pickup_date date,
    delivery_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.loads enable row level security;

-- Documents (Linked to Storage)
create type public.document_type as enum ('BOL', 'POD', 'Rate_Con', 'Invoice');

create table public.documents (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    load_id uuid references public.loads(id) on delete cascade,
    type document_type not null,
    file_path text not null,
    file_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.documents enable row level security;

-- 4. Row Level Security (RLS) Policies
-- These policies ensure a user can only interact with rows belonging to their org_id.
-- (Assumes public.profiles is queried or auth.jwt() claims contain org_id).

-- A helper function to get current user's org_id
create or replace function get_user_org_id() returns uuid as $$
  select org_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

-- Organizations: users can view their own org
create policy "Users can view their own organization" on public.organizations
  for select using (id = get_user_org_id());

-- Profiles: users can view all profiles in their org
create policy "Users can view profiles in their org" on public.profiles
  for select using (org_id = get_user_org_id());

-- Profiles: users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- Customers: scoped by org_id
create policy "Org isolation for customers" on public.customers
  for all using (org_id = get_user_org_id());

-- Customer Contacts: scoped by linking to customer's org
create policy "Org isolation for customer_contacts" on public.customer_contacts
  for all using (customer_id in (select id from public.customers where org_id = get_user_org_id()));

-- Customer Documents: scoped by linking to customer's org
create policy "Org isolation for customer_documents" on public.customer_documents
  for all using (customer_id in (select id from public.customers where org_id = get_user_org_id()));

-- Carrier Accounts: scoped by org_id
create policy "Org isolation for carrier_accounts" on public.carrier_accounts
  for all using (org_id = get_user_org_id());

-- Loads: scoped by org_id
create policy "Org isolation for loads" on public.loads
  for all using (org_id = get_user_org_id());

-- Documents: scoped by org_id
create policy "Org isolation for documents" on public.documents
  for all using (org_id = get_user_org_id());

-- Settings: scoped by org_id
create policy "Org isolation for settings" on public.settings
  for all using (org_id = get_user_org_id());

-- Permissions: read-only for all authenticated users
create policy "Anyone can view permissions" on public.permissions
  for select using (auth.role() = 'authenticated');

-- Role Permissions: read-only for all authenticated users
create policy "Anyone can view role_permissions" on public.role_permissions
  for select using (auth.role() = 'authenticated');

-- Storage Bucket configuration
insert into storage.buckets (id, name, public) 
values ('customer-documents', 'customer-documents', false)
on conflict (id) do nothing;

create policy "Users can upload customer documents" on storage.objects
  for insert with check ( bucket_id = 'customer-documents' and auth.role() = 'authenticated' );

create policy "Users can view customer documents" on storage.objects
  for select using ( bucket_id = 'customer-documents' and auth.role() = 'authenticated' );

create policy "Users can update customer documents" on storage.objects
  for update using ( bucket_id = 'customer-documents' and auth.role() = 'authenticated' );

create policy "Users can delete customer documents" on storage.objects
  for delete using ( bucket_id = 'customer-documents' and auth.role() = 'authenticated' );

-- 5. Helper function for Symmetric Encryption via pgcrypto
-- The standard pattern is to encrypt from the middle-tier (Next.js server edge) 
-- passing the symmetric key, or encrypt directly in Postgres if providing the key.
-- This creates a view or functions to securely handle API keys.

-- Function to encrypt a value given a secret key.
create or replace function public.encrypt_api_key(raw_key text, secret_key text) 
returns text as $$
  select pgp_sym_encrypt(raw_key, secret_key)::text;
$$ language sql security definer;

-- Function to decrypt a value given a secret key.
create or replace function public.decrypt_api_key(encrypted_key text, secret_key text) 
returns text as $$
  select pgp_sym_decrypt(encrypted_key::bytea, secret_key);
$$ language sql security definer;
