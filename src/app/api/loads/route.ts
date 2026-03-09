import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();

        // Fetch loads with related customer, shipper, and consignee names
        const { data, error } = await supabase
            .from('loads')
            .select(`
                *,
                customer:customers(company_name),
                shipper:shipper_consignees!shipper_id(name),
                consignee:shipper_consignees!consignee_id(name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ loads: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        // Need an org_id
        let org_id = body.org_id;
        if (!org_id) {
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                org_id = orgs[0].id;
            } else {
                throw new Error("No organization found. Please create one.");
            }
        }

        const { data, error } = await supabase
            .from('loads')
            .insert([{
                org_id,
                customer_id: body.customer_id || null,
                status: body.status || 'Not Dispatched',
                origin_zip: body.origin_zip || null,
                destination_zip: body.destination_zip || null,
                total_weight: body.total_weight || null,
                nmfc_class: body.nmfc_class || null,
                total_pallets: body.total_pallets || null,
                customer_rate: body.customer_rate || 0,
                carrier_rate: body.carrier_rate || 0,
                fuel_surcharge: body.fuel_surcharge || 0,
                carrier_quote_id: body.carrier_quote_id || null,
                carrier_pro_number: body.carrier_pro_number || null,
                selected_carrier_id: body.selected_carrier_id || null,
                pickup_date: body.pickup_date || null,
                delivery_date: body.delivery_date || null,
                shipper_id: body.shipper_id || null,
                consignee_id: body.consignee_id || null
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ load: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
