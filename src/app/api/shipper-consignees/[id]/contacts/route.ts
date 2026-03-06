import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('shipper_consignee_contacts')
            .select('*')
            .eq('shipper_consignee_id', id)
            .order('name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ contacts: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        // Check if there are already 10 contacts
        const { count, error: countError } = await supabase
            .from('shipper_consignee_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('shipper_consignee_id', id);

        if (countError) throw countError;

        if (count && count >= 10) {
            return NextResponse.json({ error: 'Maximum of 10 contacts allowed per Shipper/Consignee.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('shipper_consignee_contacts')
            .insert([{
                shipper_consignee_id: id,
                name: body.name,
                phone: body.phone,
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
