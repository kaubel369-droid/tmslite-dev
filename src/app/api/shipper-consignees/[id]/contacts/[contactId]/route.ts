import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string, contactId: string }> }
) {
    const { id, contactId } = await params;
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('shipper_consignee_contacts')
            .update({
                name: body.name,
                phone: body.phone,
                cell_phone: body.cell_phone,
                email: body.email,
                position: body.position,
                notes: body.notes
            })
            .eq('id', contactId)
            .eq('shipper_consignee_id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contact: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string, contactId: string }> }
) {
    const { id, contactId } = await params;
    try {
        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from('shipper_consignee_contacts')
            .delete()
            .eq('id', contactId)
            .eq('shipper_consignee_id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
