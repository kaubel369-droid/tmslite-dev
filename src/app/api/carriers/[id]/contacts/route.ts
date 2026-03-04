import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carrier_contacts')
            .select('*')
            .eq('carrier_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ contacts: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const supabase = getServiceRoleClient();

        // Check if limit of 10 is reached
        const { count, error: countError } = await supabase
            .from('carrier_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('carrier_id', id);

        if (countError) throw countError;
        if (count && count >= 10) {
            return NextResponse.json({ error: 'Maximum of 10 contacts allowed per carrier' }, { status: 400 });
        }

        // Get carrier org_id
        const { data: carrierInfo, error: carrierError } = await supabase
            .from('carriers')
            .select('org_id')
            .eq('id', id)
            .single();

        if (carrierError || !carrierInfo) throw new Error('Carrier not found');

        const { data, error } = await supabase
            .from('carrier_contacts')
            .insert([{
                carrier_id: id,
                org_id: carrierInfo.org_id,
                name: body.name,
                phone: body.phone,
                ext: body.ext,
                cell_phone: body.cell_phone,
                email: body.email,
                position: body.position,
                notes: body.notes
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contact: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
