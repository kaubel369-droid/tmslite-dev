-- Supabase Database Schema Snapshot
-- Generated on 2026-03-20

-- 1. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 2. Custom Types (Enums)
create type public.user_role as enum (
  'Admin', 
  'Broker', 
  'Dispatcher', 
  'Supervisor', 
  'Customer Service Rep', 
  'Sales Rep', 
  'Customer', 
  'Sales Rep/Customer Service Rep'
);

create type public.customer_status as enum ('Active', 'Credit Hold', 'Inactive');

create type public.document_type as enum (
  'BOL', 
  'POD', 
  'Rate_Con', 
  'Invoice', 
  'Other', 
  'Insurance', 
  'W9', 
  'License'
);

create type public.load_status as enum (
  'Not Dispatched', 
  'Dispatched', 
  'In-Transit', 
  'Delivered', 
  'Invoiced', 
  'Cancelled'
);

create type public.sales_lead_status as enum ('New', 'Contacted', 'Qualified', 'Lost', 'Converted');

create type public.shipper_consignee_status as enum ('Active', 'Credit Hold', 'Inactive');

-- 3. Sequences
create sequence if not exists public.load_number_seq start 1000;
create sequence if not exists public.quote_number_seq start 1000;
create sequence if not exists public.customer_spot_quote_number_seq start 1000;

-- 4. Tables

-- Organizations
create table public.organizations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    mc_number text,
    dot_number text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.organizations enable row level security;

-- Customers
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
    dispatch_notes text,
    credit_limit numeric(10,2) default 0.00,
    payment_terms text,
    sales_person_id uuid, -- Reference to profiles(id) added later
    carrier_configs jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customers enable row level security;

-- Profiles linking to auth.users
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    org_id uuid references public.organizations(id) on delete set null,
    first_name text,
    last_name text,
    email text,
    role user_role default 'Broker'::user_role not null,
    customer_id uuid references public.customers(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

-- Add sales_person_id reference to customers
alter table public.customers add foreign key (sales_person_id) references public.profiles(id) on delete set null;

-- Carriers
create table public.carriers (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    address text,
    city text,
    state text,
    zip text,
    phone text,
    website text,
    dot_number text,
    ein text,
    mc_number text,
    scac text,
    status text default 'Active'::text,
    safety_rating text,
    last_safety_check timestamp with time zone,
    insurance_status text,
    notes text,
    api_enabled boolean default false,
    api_url text,
    api_key text,
    api_secret text,
    api_username text,
    api_password text,
    api_account_number text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
alter table public.carriers enable row level security;

-- Carrier Accounts (Historical/Linked Credentials)
create table public.carrier_accounts (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    carrier_name text not null,
    scac_code text not null,
    api_client_id text,
    api_client_secret text,
    api_key text,
    account_number text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.carrier_accounts enable row level security;

-- Shipper & Consignee Locations
create table public.shipper_consignees (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    customer_id uuid references public.customers(id) on delete set null,
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

-- Loads (TMS Workflow)
create table public.loads (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    customer_id uuid references public.customers(id) on delete restrict,
    load_number text not null unique default (nextval('load_number_seq'::regclass))::text,
    status load_status default 'Not Dispatched'::load_status not null,
    load_type text default 'LTL'::text,
    origin_zip text not null,
    destination_zip text not null,
    total_weight numeric(10,2) not null,
    nmfc_class text,
    total_pallets integer,
    customer_rate numeric(10,2),
    carrier_rate numeric(10,2),
    fuel_surcharge numeric(10,2),
    mileage numeric,
    carrier_quote_id text,
    carrier_pro_number text,
    bol_number text,
    selected_carrier_id uuid references public.carriers(id) on delete restrict,
    pickup_date date,
    delivery_date date,
    shipper_id uuid references public.shipper_consignees(id) on delete restrict,
    consignee_id uuid references public.shipper_consignees(id) on delete restrict,
    internal_notes text,
    bol_notes text,
    tracing_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.loads enable row level security;

-- Load Products (Line Items)
create table public.load_products (
    id uuid default gen_random_uuid() primary key,
    load_id uuid references public.loads(id) on delete cascade not null,
    description text,
    pallets integer,
    weight numeric,
    pcs integer,
    unit_type text default 'PLT'::text,
    nmfc_class text,
    length_in numeric,
    width_in numeric,
    height_in numeric,
    cubic_feet numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.load_products enable row level security;

-- Documents (Linked to Storage)
create table public.documents (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    load_id uuid references public.loads(id) on delete cascade,
    type document_type not null,
    file_path text not null,
    file_name text,
    is_private boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.documents enable row level security;

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

-- Customer Contacts
create table public.customer_contacts (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null,
    name text not null,
    phone text,
    ext varchar,
    cell_phone text,
    email text,
    position text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customer_contacts enable row level security;

-- Customer Documents
create table public.customer_documents (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null,
    file_name text not null,
    file_path text not null,
    uploaded_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customer_documents enable row level security;

-- Carrier Contacts
create table public.carrier_contacts (
    id uuid default gen_random_uuid() primary key,
    carrier_id uuid references public.carriers(id) on delete cascade not null,
    org_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    phone text,
    ext text,
    cell_phone text,
    email text,
    position text,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
alter table public.carrier_contacts enable row level security;

-- Carrier Documents
create table public.carrier_documents (
    id uuid default gen_random_uuid() primary key,
    carrier_id uuid references public.carriers(id) on delete cascade not null,
    org_id uuid references public.organizations(id) on delete cascade not null,
    file_name text not null,
    file_path text not null,
    uploaded_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default now()
);
alter table public.carrier_documents enable row level security;

-- Carrier Insurance
create table public.carrier_insurance (
    id uuid default extensions.uuid_generate_v4() primary key,
    carrier_id uuid references public.carriers(id) on delete cascade not null unique,
    org_id uuid references public.organizations(id) on delete cascade not null,
    insurance_company text,
    policy_number text,
    expiration_date date,
    coverage_amount text,
    agent text,
    phone text,
    email text,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
alter table public.carrier_insurance enable row level security;

-- Shipper & Consignee Contacts
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

-- Sales Lead Contacts
create table public.sales_lead_contacts (
    id uuid default gen_random_uuid() primary key,
    sales_lead_id uuid references public.sales_leads(id) on delete cascade not null,
    name text not null,
    phone text,
    ext text,
    cell_phone text,
    email text,
    position text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sales_lead_contacts enable row level security;

-- Sales Lead Activities
create table public.sales_lead_activities (
    id uuid default gen_random_uuid() primary key,
    sales_lead_id uuid references public.sales_leads(id) on delete cascade not null,
    activity_date timestamp with time zone not null,
    activity_type text not null check (activity_type = ANY (ARRAY['Phone Call'::text, 'Email'::text, 'In Person'::text, 'Other'::text])),
    description text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sales_lead_activities enable row level security;

-- Zip Codes
create table public.zip_codes (
    zip text primary key,
    city text not null,
    state_id text not null,
    state_name text not null
);
alter table public.zip_codes enable row level security;

-- Accessorials
create table public.accessorials (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade,
    name text not null,
    min_charge numeric,
    max_charge numeric,
    charge_per_pound numeric,
    charge_per_piece numeric,
    fixed_price numeric,
    "API_code" text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
alter table public.accessorials enable row level security;

-- Carrier Accessorials
create table public.carrier_accessorials (
    id uuid default gen_random_uuid() primary key,
    carrier_id uuid references public.carriers(id) on delete cascade not null,
    accessorial_id uuid references public.accessorials(id) on delete cascade not null,
    org_id uuid references public.organizations(id) on delete cascade not null,
    min_charge numeric,
    max_charge numeric,
    charge_per_pound numeric,
    charge_per_piece numeric,
    fixed_price numeric,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
alter table public.carrier_accessorials enable row level security;

-- Rate Quotes (Carrier API Responses)
create table public.rate_quotes (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    load_id uuid references public.loads(id) on delete cascade,
    carrier_id uuid references public.carriers(id) on delete cascade not null,
    base_rate numeric default 0,
    accessorial_total numeric default 0,
    total_rate numeric default 0,
    customer_total_rate numeric default 0,
    transit_days integer,
    quote_id text,
    raw_response jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.rate_quotes enable row level security;

-- Quotes
create table public.quotes (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    customer_id uuid references public.customers(id) on delete cascade not null,
    quote_number text not null unique default ('Q-'::text || (nextval('quote_number_seq'::regclass))::text),
    carrier_id uuid references public.carriers(id) on delete cascade,
    carrier_name text,
    scac text,
    base_rate numeric,
    fuel_surcharge numeric,
    accessorials_total numeric,
    total_carrier_rate numeric,
    customer_rate numeric,
    transit_days integer,
    origin_info jsonb,
    destination_info jsonb,
    items jsonb,
    accessorials jsonb,
    created_at timestamp with time zone default now(),
    created_by uuid references public.profiles(id) on delete set null
);
alter table public.quotes enable row level security;

-- Document Templates
create table public.document_templates (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade,
    name text not null,
    slug text not null,
    content text not null,
    type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.document_templates enable row level security;

-- Customer Spot Quotes
create table public.customer_spot_quotes (
    id uuid default gen_random_uuid() primary key,
    org_id uuid references public.organizations(id) on delete cascade not null,
    customer_id uuid references public.customers(id) on delete cascade not null,
    quote_number text unique default (nextval('customer_spot_quote_number_seq'::regclass))::text,
    quote_date timestamp with time zone default timezone('utc'::text, now()),
    rate numeric default 0.00,
    carrier_rate numeric,
    carrier_id uuid references public.carriers(id) on delete set null,
    shipper_location_id uuid references public.shipper_consignees(id),
    consignee_location_id uuid references public.shipper_consignees(id),
    shipper_zip text,
    shipper_city text,
    shipper_state text,
    consignee_zip text,
    consignee_city text,
    consignee_state text,
    pcs integer,
    type text,
    weight numeric,
    cubic_ft numeric,
    shipment_type text,
    products jsonb,
    accessorials jsonb,
    additional_instructions text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customer_spot_quotes enable row level security;

-- Calendar Events
create table public.calendar_events (
    id uuid default gen_random_uuid() primary key,
    event_number bigint generated by default as identity (start with 1000),
    event_date date not null,
    event_time time without time zone,
    event_type text not null check (event_type = ANY (ARRAY['Appointment'::text, 'Task'::text, 'Event'::text])),
    description text not null,
    notes text,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text default 'Pending'::text check (status = ANY (ARRAY['Pending'::text, 'In Progress'::text, 'Completed'::text, 'Cancelled'::text])),
    assigned_to_role text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id),
    last_modified_date timestamp with time zone default timezone('utc'::text, now()) not null,
    last_modified_by uuid references auth.users(id)
);
alter table public.calendar_events enable row level security;

-- 5. Functions

-- Helper function to get current user's org_id
create or replace function public.get_user_org_id() 
returns uuid as $$
  select org_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

-- Encryption functions
create or replace function public.encrypt_api_key(raw_key text, secret_key text) 
returns text as $$
  select pgp_sym_encrypt(raw_key, secret_key)::text;
$$ language sql security definer;

create or replace function public.decrypt_api_key(encrypted_key text, secret_key text) 
returns text as $$
  select pgp_sym_decrypt(encrypted_key::bytea, secret_key);
$$ language sql security definer;

-- Update updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Sync profile email from auth.users
create or replace function public.handle_sync_profile_email()
returns trigger as $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language plpgsql;

-- Public tracking info function
create or replace function public.get_public_tracking_info(p_load_number text)
returns table(load_number text, status load_status, origin_zip text, destination_zip text, last_updated timestamp with time zone) as $$
  SELECT 
    l.load_number, 
    l.status, 
    l.origin_zip, 
    l.destination_zip, 
    l.updated_at as last_updated
  FROM public.loads l
  WHERE l.load_number = p_load_number;
$$ language sql security definer;

-- 6. Triggers

create trigger sync_profile_email
after update of email on auth.users
for each row execute function public.handle_sync_profile_email();

-- Updated_at triggers
create trigger update_carriers_updated_at before update on public.carriers for each row execute function public.update_updated_at_column();
create trigger update_settings_updated_at before update on public.settings for each row execute function public.update_updated_at_column();
create trigger update_loads_updated_at before update on public.loads for each row execute function public.update_updated_at_column();
create trigger update_sales_leads_updated_at before update on public.sales_leads for each row execute function public.update_updated_at_column();

-- 7. RLS Policies

-- Organization policies
create policy "Users can view their own organization" on public.organizations for select using (id = get_user_org_id());

-- Profile policies
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());
create policy "Users can view profiles in their org" on public.profiles for select using (org_id = get_user_org_id());

-- Customer policies
create policy "Org isolation for customers" on public.customers for all using (org_id = get_user_org_id());
create policy "Org isolation for customer_contacts" on public.customer_contacts for all using (customer_id in (select id from public.customers where org_id = get_user_org_id()));
create policy "Org isolation for customer_documents" on public.customer_documents for all using (customer_id in (select id from public.customers where org_id = get_user_org_id()));

-- Carrier policies
create policy "Users can view carriers in their organization" on public.carriers for select using ((org_id)::text = (auth.jwt() ->> 'org_id'::text));
create policy "Users can insert carriers in their organization" on public.carriers for insert with check ((org_id)::text = (auth.jwt() ->> 'org_id'::text));
create policy "Users can update carriers in their organization" on public.carriers for update using ((org_id)::text = (auth.jwt() ->> 'org_id'::text)) with check ((org_id)::text = (auth.jwt() ->> 'org_id'::text));
create policy "Users can delete carriers in their organization" on public.carriers for delete using ((org_id)::text = (auth.jwt() ->> 'org_id'::text));

-- Carrier Account policies
create policy "Org isolation for carrier_accounts" on public.carrier_accounts for all using (org_id = get_user_org_id());

-- Shipper/Consignee policies
create policy "Org isolation for shipper_consignees" on public.shipper_consignees for all using (org_id = get_user_org_id());
create policy "Org isolation for shipper_consignee_contacts" on public.shipper_consignee_contacts for all using (shipper_consignee_id in (select id from public.shipper_consignees where org_id = get_user_org_id()));

-- Load policies
create policy "Org isolation for loads" on public.loads for all using (
  (org_id = get_user_org_id()) AND (
    (EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Admin', 'Supervisor', 'Sales Rep', 'Customer Service Rep', 'Sales Rep/Customer Service Rep'))) OR 
    ((EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Customer')) AND (customer_id = (select profiles.customer_id from profiles where profiles.id = auth.uid())))
  )
);
create policy "Org isolation for load_products" on public.load_products for all using (load_id in (select id from loads where org_id = get_user_org_id()));

-- Document policies
create policy "Org isolation for documents" on public.documents for all using (
  (org_id = get_user_org_id()) AND (
    (EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Admin', 'Supervisor', 'Sales Rep', 'Customer Service Rep', 'Sales Rep/Customer Service Rep'))) OR 
    ((EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Customer')) AND (type <> 'Rate_Con'::document_type) AND (load_id in (select loads.id from loads where loads.customer_id = (select profiles.customer_id from profiles where profiles.id = auth.uid()))))
  )
);

-- Carrier Document policies
create policy "Users can view carrier documents in their organization" on public.carrier_documents for select using ((org_id)::text = (auth.jwt() ->> 'org_id'::text));
create policy "Users can insert carrier documents in their organization" on public.carrier_documents for insert with check ((org_id)::text = (auth.jwt() ->> 'org_id'::text));
create policy "Users can update carrier documents in their organization" on public.carrier_documents for update using ((org_id)::text = (auth.jwt() ->> 'org_id'::text)) with check ((org_id)::text = (auth.jwt() ->> 'org_id'::text));
create policy "Only Supervisor or Admin can delete carrier documents" on public.carrier_documents for delete using (((org_id)::text = (auth.jwt() ->> 'org_id'::text)) AND (EXISTS (select 1 from profiles where profiles.id = auth.uid() and role in ('Admin', 'Supervisor'))));

-- Carrier Insurance policies
create policy "Users can manage their organization's carrier insurance" on public.carrier_insurance for all using (org_id = ((auth.jwt() ->> 'org_id'::text))::uuid) with check (org_id = ((auth.jwt() ->> 'org_id'::text))::uuid);

-- Sales Lead policies
create policy "Admins and Supervisors have full access to sales leads in org" on public.sales_leads for all using ((org_id = get_user_org_id()) AND (EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Admin', 'Supervisor'))));
create policy "Sales Reps can access assigned sales leads" on public.sales_leads for all using ((org_id = get_user_org_id()) AND (EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Sales Rep', 'Sales Rep/Customer Service Rep'))) AND (assigned_to = auth.uid()));
create policy "Org isolation for sales_lead_contacts" on public.sales_lead_contacts for all using (sales_lead_id in (select id from sales_leads where org_id = get_user_org_id()));
create policy "Org isolation for sales_lead_activities" on public.sales_lead_activities for all using (sales_lead_id in (select id from sales_leads where org_id = get_user_org_id()));

-- Accessorial policies
create policy "Admins can manage accessorials for their organization" on public.accessorials for all using (auth.uid() in (select p.id from profiles p where p.org_id = accessorials.org_id and p.role = 'Admin')) with check (auth.uid() in (select p.id from profiles p where p.org_id = accessorials.org_id and p.role = 'Admin'));
create policy "Users can view their organization's accessorials" on public.accessorials for select using (auth.uid() in (select p.id from profiles p where p.org_id = accessorials.org_id));

create policy "Users can manage carrier accessorials in their organization" on public.carrier_accessorials for all using (auth.uid() in (select p.id from profiles p where p.org_id = carrier_accessorials.org_id)) with check (auth.uid() in (select p.id from profiles p where p.org_id = carrier_accessorials.org_id));
create policy "Users can view carrier accessorials in their organization" on public.carrier_accessorials for select using (auth.uid() in (select p.id from profiles p where p.org_id = carrier_accessorials.org_id));

-- Rate Quote & Quote policies
create policy "Org isolation for rate_quotes" on public.rate_quotes for all using (org_id = get_user_org_id());
create policy "Users can manage quotes in their organization" on public.quotes for all using (org_id in (select profiles.org_id from profiles where profiles.id = auth.uid())) with check (org_id in (select profiles.org_id from profiles where profiles.id = auth.uid()));
create policy "Users can view quotes in their organization" on public.quotes for select using (org_id in (select profiles.org_id from profiles where profiles.id = auth.uid()));

-- Settings & Template policies
create policy "Org isolation for settings" on public.settings for all using (org_id = get_user_org_id());
create policy "Admins can do everything on document_templates" on public.document_templates for all using (EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin'));

-- Spot Quote policies
create policy "Org isolation for customer_spot_quotes" on public.customer_spot_quotes for all using (org_id = get_user_org_id());

-- Calendar Event policies
create policy "Admins and Supervisors can insert calendar events for anyone" on public.calendar_events for insert with check ((EXISTS (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Admin', 'Supervisor'))) OR (user_id = auth.uid()));
create policy "Users can manage assigned and created events" on public.calendar_events for all using ((user_id = auth.uid()) OR (created_by = auth.uid())) with check ((user_id = auth.uid()) OR (created_by = auth.uid()));
create policy "Users can view assigned and created events" on public.calendar_events for select using ((user_id = auth.uid()) OR (created_by = auth.uid()));

-- Permission policies
create policy "Anyone can view permissions" on public.permissions for select using (auth.role() = 'authenticated');
create policy "Anyone can view role_permissions" on public.role_permissions for select using (auth.role() = 'authenticated');

-- 8. Storage Buckets & Policies

insert into storage.buckets (id, name, public) values ('customer-documents', 'customer-documents', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('carrier-documents', 'carrier-documents', false) on conflict (id) do nothing;

create policy "Users can manage customer documents" on storage.objects for all using (bucket_id = 'customer-documents' and auth.role() = 'authenticated');
create policy "Users can manage carrier documents for their organization" on storage.objects for all to authenticated using (bucket_id = 'carrier-documents' AND (storage.foldername(name))[1] = auth.jwt() ->> 'org_id');
