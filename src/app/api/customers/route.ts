import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();

        // Fetch all customers. If auth is added later, we should filter by org_id.
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ customers: data });
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

        const { data, error } = await supabase
            .from('customers')
            .insert([{
                org_id,
                company_name: body.company_name,
                primary_contact: body.primary_contact,
                email: body.email,
                phone: body.phone,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                website: body.website,
                status: body.status || 'Active',
                notes: body.notes,
                credit_limit: body.credit_limit || 0,
                payment_terms: body.payment_terms,
                sales_person_id: body.sales_person_id
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ customer: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
