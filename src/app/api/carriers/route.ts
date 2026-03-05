import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// Mock function for SAFER API check
async function checkSaferAPI(dotNumber?: string, mcNumber?: string): Promise<boolean> {
    // In a real implementation, this would make an HTTP request to the FMCSA SAFER API
    // e.g., fetch(`https://api.safer.fmcsa.dot.gov/...`)
    // For now, if a number is provided, we simulate a successful find (true).
    if (dotNumber && dotNumber.trim() !== '') return true;
    if (mcNumber && mcNumber.trim() !== '') return true;
    return false; // If neither text is found/valid, return false
}

export async function GET() {
    try {
        const supabase = getServiceRoleClient();

        // Fetch all carriers. If auth is added later, we should filter by org_id.
        const { data, error } = await supabase
            .from('carriers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map `name` to `company_name` for the frontend
        const carriersData = data.map(carrier => ({
            ...carrier,
            company_name: carrier.name
        }));

        return NextResponse.json({ carriers: carriersData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        // For now, since org_id is required, we need a default org_id if one isn't provided.
        // Let's get the first organization or create a default one.
        let org_id = body.org_id;

        if (!org_id) {
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                org_id = orgs[0].id;
            } else {
                // Create a default organization
                const { data: newOrg, error: orgError } = await supabase
                    .from('organizations')
                    .insert([{ name: 'Default Org' }])
                    .select()
                    .single();
                if (orgError) throw orgError;
                org_id = newOrg.id;
            }
        }

        let finalStatus = body.status || 'Active';

        // Check DOT / MC numbers against SAFER API logic
        if (body.dot_number || body.mc_number) {
            const isFound = await checkSaferAPI(body.dot_number, body.mc_number);
            if (!isFound) {
                finalStatus = 'Inactive';
            } else {
                finalStatus = 'Active';
            }
        }

        const { data, error } = await supabase
            .from('carriers')
            .insert([{
                org_id,
                name: body.company_name,
                phone: body.phone,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                status: finalStatus,
                website: body.website,
                dot_number: body.dot_number,
                ein: body.ein,
                mc_number: body.mc_number,
                scac: body.scac,
                insurance_status: body.insurance_status,
                notes: body.notes,
                api_key: body.api_key,
                api_secret: body.api_secret,
                api_url: body.api_url,
                api_account_number: body.api_account_number,
                api_username: body.api_username,
                api_password: body.api_password,
                api_enabled: body.api_enabled
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ carrier: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
