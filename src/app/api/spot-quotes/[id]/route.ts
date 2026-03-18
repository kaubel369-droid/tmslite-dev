import { getServiceRoleClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = getServiceRoleClient();

    try {
        const { data: quote, error } = await supabase
            .from('customer_spot_quotes')
            .select(`
                *,
                shipper:shipper_consignees!shipper_location_id(*),
                consignee:shipper_consignees!consignee_location_id(*),
                carriers!carrier_id(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const carrierData = (quote as any).carriers;
        const formattedQuote = {
            ...quote,
            carrier_name: carrierData
                ? (Array.isArray(carrierData) ? carrierData[0]?.name : (carrierData as any).name)
                : 'Not Assigned'
        };

        return NextResponse.json({ quote: formattedQuote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const supabase = await createClient();
        const serviceAuth = getServiceRoleClient();
        
        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { 
            carrier_id, rate, carrier_rate, shipper_location_id, consignee_location_id,
            shipper_zip, shipper_city, shipper_state, consignee_zip, consignee_city, consignee_state,
            type, shipment_type, additional_instructions, products, accessorials, pcs, weight, cubic_ft
        } = body;

        const { data: quote, error } = await serviceAuth
            .from('customer_spot_quotes')
            .update({
                carrier_id, rate, carrier_rate, shipper_location_id, consignee_location_id,
                shipper_zip, shipper_city, shipper_state, consignee_zip, consignee_city, consignee_state,
                type, shipment_type, additional_instructions, products, accessorials, pcs, weight, cubic_ft
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ quote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
