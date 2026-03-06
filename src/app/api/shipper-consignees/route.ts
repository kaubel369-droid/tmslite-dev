import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('shipper_consignees')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ shipper_consignees: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        let org_id = body.org_id;

        if (!org_id) {
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                org_id = orgs[0].id;
            } else {
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
            .from('shipper_consignees')
            .insert([{
                org_id,
                name: body.name,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                phone: body.phone,
                email: body.email,
                website: body.website,
                status: body.status || 'Active',
                notes: body.notes
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ shipper_consignee: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
