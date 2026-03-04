-- Create carriers table
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for carriers
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- Create policies for carriers
CREATE POLICY "Users can view carriers in their organization"
    ON public.carriers FOR SELECT
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can insert carriers in their organization"
    ON public.carriers FOR INSERT
    WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can update carriers in their organization"
    ON public.carriers FOR UPDATE
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text)
    WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can delete carriers in their organization"
    ON public.carriers FOR DELETE
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text);

-- Create carrier_contacts table
CREATE TABLE IF NOT EXISTS public.carrier_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    ext TEXT,
    cell_phone TEXT,
    email TEXT,
    position TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for carrier_contacts
ALTER TABLE public.carrier_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for carrier_contacts
CREATE POLICY "Users can view carrier contacts in their organization"
    ON public.carrier_contacts FOR SELECT
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can insert carrier contacts in their organization"
    ON public.carrier_contacts FOR INSERT
    WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can update carrier contacts in their organization"
    ON public.carrier_contacts FOR UPDATE
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text)
    WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can delete carrier contacts in their organization"
    ON public.carrier_contacts FOR DELETE
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text);

-- Create carrier_documents table
CREATE TABLE IF NOT EXISTS public.carrier_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for carrier_documents
ALTER TABLE public.carrier_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for carrier_documents
CREATE POLICY "Users can view carrier documents in their organization"
    ON public.carrier_documents FOR SELECT
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can insert carrier documents in their organization"
    ON public.carrier_documents FOR INSERT
    WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "Users can update carrier documents in their organization"
    ON public.carrier_documents FOR UPDATE
    USING (org_id::text = (auth.jwt() ->> 'org_id')::text)
    WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id')::text);

-- Restrict document deletion to Supervisor or Admin roles
CREATE POLICY "Only Supervisor or Admin can delete carrier documents"
    ON public.carrier_documents FOR DELETE
    USING (
        org_id::text = (auth.jwt() ->> 'org_id')::text AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Supervisor')
        )
    );

-- Insert into storage.buckets if missing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('carrier-documents', 'carrier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for carrier-documents
CREATE POLICY "Users can upload carrier documents for their organization"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'carrier-documents' AND 
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Users can view carrier documents for their organization"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'carrier-documents' AND 
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Admins and Supervisors can delete carrier documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'carrier-documents' AND 
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id' AND 
  EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('Admin', 'Supervisor')
    )
);

