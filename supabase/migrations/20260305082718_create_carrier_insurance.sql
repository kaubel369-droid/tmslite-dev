-- Create the carrier_insurance table
CREATE TABLE public.carrier_insurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    org_id UUID NOT NULL,
    insurance_company TEXT,
    policy_number TEXT,
    expiration_date DATE,
    coverage_amount TEXT,
    agent TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one insurance record per carrier (optional depending on business logic, but typical for this kind of "tab" view)
    UNIQUE(carrier_id)
);

-- Enable RLS
ALTER TABLE public.carrier_insurance ENABLE ROW LEVEL SECURITY;

-- Create policy for users based on org_id
CREATE POLICY "Users can manage their organization's carrier insurance"
    ON public.carrier_insurance
    USING (
        org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    WITH CHECK (
        org_id = (auth.jwt() ->> 'org_id')::uuid
    );


