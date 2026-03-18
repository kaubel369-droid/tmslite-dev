import { getServiceRoleClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: customerId } = await params;
    const supabase = getServiceRoleClient();

    try {
        const { data: quotes, error } = await supabase
            .from('customer_spot_quotes')
            .select(`
                *,
                shipper:shipper_consignees!shipper_location_id(*),
                consignee:shipper_consignees!consignee_location_id(*),
                carriers!carrier_id(id, name)
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedQuotes = quotes?.map(q => ({
            ...q,
            carrier_name: (q as any).carriers
                ? (Array.isArray((q as any).carriers) ? (q as any).carriers[0]?.name : (q as any).carriers.name)
                : 'Not Assigned'
        }));

        return NextResponse.json({ quotes: formattedQuotes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: customerId } = await params;

    try {
        const body = await request.json();
        const supabase = await createClient();
        const serviceAuth = getServiceRoleClient();

        // Get organization ID from profile using authenticated client
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        const { 
            carrier_id, rate, carrier_rate, shipper_location_id, consignee_location_id,
            shipper_zip, shipper_city, shipper_state, consignee_zip, consignee_city, consignee_state,
            type, additional_instructions, products, accessorials, pcs, weight, cubic_ft
        } = body;

        const { data: quote, error } = await serviceAuth
            .from('customer_spot_quotes')
            .insert({
                carrier_id, rate, carrier_rate, shipper_location_id, consignee_location_id,
                shipper_zip, shipper_city, shipper_state, consignee_zip, consignee_city, consignee_state,
                type, additional_instructions, products, accessorials, pcs, weight, cubic_ft,
                customer_id: customerId,
                org_id: profile?.org_id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ quote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
