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
        // const { id: _, org_id, customer_id, quote_number, created_at, products_list, ...updateData } = body;

        const { data: quote, error } = await serviceAuth
            .from('customer_spot_quotes')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ quote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
