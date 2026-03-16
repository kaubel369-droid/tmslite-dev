import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: customerId } = await params;
    const supabase = await createClient();

    try {
        const { data: quotes, error } = await supabase
            .from('customer_spot_quotes')
            .select(`
                *,
                shipper:shipper_consignees!shipper_location_id(*),
                consignee:shipper_consignees!consignee_location_id(*),
                carrier:carriers(id, name)
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ quotes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: customerId } = await params;
    const supabase = await createClient();

    try {
        const body = await request.json();
        
        // Get organization ID from profile
        const { data: profile } = await supabase.from('profiles').select('org_id').single();
        if (!profile?.org_id) throw new Error('Organization not found');

        const { products_list, ...rest } = body;

        const { data: quote, error } = await supabase
            .from('customer_spot_quotes')
            .insert({
                ...rest,
                customer_id: customerId,
                org_id: profile.org_id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ quote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
