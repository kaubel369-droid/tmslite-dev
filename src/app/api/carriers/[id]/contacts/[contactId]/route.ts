import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function PUT(request: Request, context: any) {
    try {
        const { id, contactId } = await context.params;
        const body = await request.json();
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carrier_contacts')
            .update({
                name: body.name,
                phone: body.phone,
                ext: body.ext,
                cell_phone: body.cell_phone,
                email: body.email,
                position: body.position,
                notes: body.notes
            })
            .eq('id', contactId)
            .eq('carrier_id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contact: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const { id, contactId } = await context.params;
        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from('carrier_contacts')
            .delete()
            .eq('id', contactId)
            .eq('carrier_id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
